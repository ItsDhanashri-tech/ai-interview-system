import os
import json
import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import jwt

from models import (
    db, User, JobRole, InterviewSession, InterviewQuestion,
    CandidateAnswer, Evaluation, InterviewReport
)
from seed_data import seed_database
from ai_service import AIService

SECRET_KEY = os.environ.get("SECRET_KEY", "ai_interview_secret_key_2026")

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="")
CORS(app)

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interview_system.db")
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()
    seed_database()

# Helper for JWT auth
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Authorization token is missing'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# ----------------- AUTH ROUTES -----------------
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'message': 'Name, email, and password are required.'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'An account with this email already exists.'}), 400

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password.'}), 401

    token = generate_token(user.id)
    return jsonify({
        'user': user.to_dict(),
        'token': token
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

# ----------------- JOB ROLES -----------------
@app.route('/api/job-roles', methods=['GET'])
def get_job_roles():
    roles = JobRole.query.all()
    return jsonify([role.to_dict() for role in roles]), 200

# ----------------- INTERVIEW SESSIONS -----------------
@app.route('/api/interviews', methods=['POST'])
@token_required
def create_interview(current_user):
    data = request.get_json() or {}
    job_role_id = data.get('job_role_id')
    interview_type = data.get('interview_type', 'Technical')
    difficulty = data.get('difficulty', 'Medium')
    question_count = int(data.get('question_count', 5))
    duration_minutes = int(data.get('duration_minutes', 15))

    job_role = JobRole.query.get(job_role_id)
    if not job_role:
        return jsonify({'message': 'Invalid job role selected.'}), 400

    session = InterviewSession(
        user_id=current_user.id,
        job_role_id=job_role.id,
        interview_type=interview_type,
        difficulty=difficulty,
        question_count=question_count,
        duration_minutes=duration_minutes,
        status='in_progress'
    )
    db.session.add(session)
    db.session.commit()

    # Generate First Question
    q_data = AIService.generate_question(
        job_role_title=job_role.title,
        category=interview_type,
        difficulty=difficulty,
        question_number=1,
        asked_questions=[]
    )

    first_question = InterviewQuestion(
        session_id=session.id,
        question_number=1,
        question_text=q_data['question_text'],
        category=q_data.get('category', interview_type),
        difficulty=difficulty,
        expected_keywords=q_data.get('expected_keywords', ''),
        sample_answer=q_data.get('sample_answer', '')
    )
    db.session.add(first_question)
    db.session.commit()

    return jsonify({
        'session': session.to_dict(),
        'first_question': first_question.to_dict()
    }), 201

@app.route('/api/interviews/<int:session_id>', methods=['GET'])
@token_required
def get_interview(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'message': 'Interview session not found.'}), 404

    questions = InterviewQuestion.query.filter_by(session_id=session.id).order_by(InterviewQuestion.question_number).all()
    
    questions_data = []
    for q in questions:
        q_dict = q.to_dict()
        if q.evaluation:
            q_dict['evaluation'] = q.evaluation.to_dict()
        if q.answers:
            q_dict['answer'] = q.answers[0].to_dict()
        questions_data.append(q_dict)

    return jsonify({
        'session': session.to_dict(),
        'questions': questions_data
    }), 200

@app.route('/api/interviews/<int:session_id>/answer', methods=['POST'])
@token_required
def submit_answer(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'message': 'Interview session not found.'}), 404

    if session.status == 'completed':
        return jsonify({'message': 'Session is already completed.'}), 400

    data = request.get_json() or {}
    question_id = data.get('question_id')
    text_response = data.get('text_response', '').strip()
    audio_used = bool(data.get('audio_used', False))
    response_time_seconds = int(data.get('response_time_seconds', 0))

    question = InterviewQuestion.query.filter_by(id=question_id, session_id=session.id).first()
    if not question:
        return jsonify({'message': 'Question not found in this session.'}), 404

    if not text_response:
        text_response = "(Candidate did not provide a text or audio response)"

    # Save Candidate Answer
    candidate_answer = CandidateAnswer(
        question_id=question.id,
        user_id=current_user.id,
        text_response=text_response,
        audio_used=audio_used,
        response_time_seconds=response_time_seconds
    )
    db.session.add(candidate_answer)
    db.session.commit()

    # Evaluate Answer via AI Service
    eval_result = AIService.evaluate_answer(
        question_text=question.question_text,
        candidate_answer_text=text_response,
        expected_keywords=question.expected_keywords or "",
        sample_answer=question.sample_answer or "",
        response_time_seconds=response_time_seconds,
        audio_used=audio_used
    )

    evaluation = Evaluation(
        question_id=question.id,
        candidate_answer_id=candidate_answer.id,
        accuracy_score=eval_result['accuracy_score'],
        completeness_score=eval_result['completeness_score'],
        relevance_score=eval_result['relevance_score'],
        communication_score=eval_result['communication_score'],
        confidence_indicator=eval_result['confidence_indicator'],
        feedback_text=eval_result['feedback_text'],
        missed_points=";".join(eval_result.get('missed_points', []))
    )
    db.session.add(evaluation)
    db.session.commit()

    # Check if more questions are needed
    existing_questions = InterviewQuestion.query.filter_by(session_id=session.id).order_by(InterviewQuestion.question_number).all()
    current_q_count = len(existing_questions)

    next_question = None
    if current_q_count < session.question_count:
        asked_texts = [q.question_text for q in existing_questions]
        next_q_number = current_q_count + 1
        q_data = AIService.generate_question(
            job_role_title=session.job_role.title,
            category=session.interview_type,
            difficulty=session.difficulty,
            question_number=next_q_number,
            asked_questions=asked_texts
        )
        next_question_obj = InterviewQuestion(
            session_id=session.id,
            question_number=next_q_number,
            question_text=q_data['question_text'],
            category=q_data.get('category', session.interview_type),
            difficulty=session.difficulty,
            expected_keywords=q_data.get('expected_keywords', ''),
            sample_answer=q_data.get('sample_answer', '')
        )
        db.session.add(next_question_obj)
        db.session.commit()
        next_question = next_question_obj.to_dict()

    return jsonify({
        'evaluation': evaluation.to_dict(),
        'next_question': next_question,
        'is_last_question': (current_q_count >= session.question_count)
    }), 200

@app.route('/api/interviews/<int:session_id>/complete', methods=['POST'])
@token_required
def complete_interview(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'message': 'Interview session not found.'}), 404

    questions = InterviewQuestion.query.filter_by(session_id=session.id).all()
    q_eval_pairs = []
    for q in questions:
        if q.evaluation:
            q_eval_pairs.append({
                "question": q.to_dict(),
                "eval": q.evaluation.to_dict()
            })

    report_data = AIService.generate_final_report(session, q_eval_pairs)

    session.status = 'completed'
    session.overall_score = report_data['overall_score']
    session.completed_at = datetime.datetime.utcnow()

    # Save Report
    report = InterviewReport(
        session_id=session.id,
        user_id=current_user.id,
        overall_score=report_data['overall_score'],
        strengths_json=json.dumps(report_data['strengths']),
        weaknesses_json=json.dumps(report_data['weaknesses']),
        missed_questions_json=json.dumps(report_data['missed_questions']),
        improvement_plan_json=json.dumps(report_data['improvement_plan']),
        category_breakdown_json=json.dumps(report_data['category_breakdown'])
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({
        'session': session.to_dict(),
        'report': report.to_dict()
    }), 200

@app.route('/api/interviews/<int:session_id>/report', methods=['GET'])
@token_required
def get_report(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'message': 'Interview session not found.'}), 404

    if not session.report:
        return jsonify({'message': 'Report not generated yet.'}), 404

    questions = InterviewQuestion.query.filter_by(session_id=session.id).order_by(InterviewQuestion.question_number).all()
    q_details = []
    for q in questions:
        q_dict = q.to_dict()
        if q.evaluation:
            q_dict['evaluation'] = q.evaluation.to_dict()
        if q.answers:
            q_dict['answer'] = q.answers[0].to_dict()
        q_details.append(q_dict)

    return jsonify({
        'session': session.to_dict(),
        'report': session.report.to_dict(),
        'questions': q_details
    }), 200

@app.route('/api/interviews/<int:session_id>', methods=['DELETE'])
@token_required
def delete_interview(current_user, session_id):
    session = InterviewSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({'message': 'Interview session not found.'}), 404

    try:
        db.session.delete(session)
        db.session.commit()
        return jsonify({'message': 'Interview history deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete interview history: {str(e)}'}), 500

@app.route('/api/interviews/history', methods=['GET'])
@token_required
def get_history(current_user):
    sessions = InterviewSession.query.filter_by(user_id=current_user.id).order_by(InterviewSession.created_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions]), 200


# ----------------- SERVE STATIC FRONTEND BUILD -----------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        index_file = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'message': 'Backend API is running. Build frontend using `npm run build` to view UI.'}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"\n=======================================================")
    print(f"  AI INTERVIEW PREPARATION SYSTEM BACKEND RUNNING")
    print(f"  URL: http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=True)
