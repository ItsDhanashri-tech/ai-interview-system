import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    sessions = db.relationship('InterviewSession', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class JobRole(db.Model):
    __tablename__ = 'job_roles'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Technical, HR, Data, etc.
    description = db.Column(db.Text, nullable=False)
    sample_topics = db.Column(db.Text, nullable=True)  # JSON or comma-separated

    sessions = db.relationship('InterviewSession', backref='job_role', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'description': self.description,
            'sample_topics': self.sample_topics.split(',') if self.sample_topics else []
        }

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_role_id = db.Column(db.Integer, db.ForeignKey('job_roles.id'), nullable=False)
    interview_type = db.Column(db.String(50), nullable=False, default='Technical')  # Technical, HR, Mixed
    difficulty = db.Column(db.String(20), nullable=False, default='Medium')  # Easy, Medium, Hard
    question_count = db.Column(db.Integer, nullable=False, default=5)
    duration_minutes = db.Column(db.Integer, nullable=True, default=15)
    status = db.Column(db.String(30), nullable=False, default='in_progress')  # in_progress, completed
    overall_score = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    questions = db.relationship('InterviewQuestion', backref='session', lazy=True, cascade="all, delete-orphan")
    report = db.relationship('InterviewReport', backref='session', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'job_role': self.job_role.to_dict() if self.job_role else None,
            'interview_type': self.interview_type,
            'difficulty': self.difficulty,
            'question_count': self.question_count,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'overall_score': round(self.overall_score, 1) if self.overall_score is not None else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'total_questions_asked': len(self.questions)
        }

class InterviewQuestion(db.Model):
    __tablename__ = 'interview_questions'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    question_number = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False, default='General')
    difficulty = db.Column(db.String(20), nullable=False, default='Medium')
    expected_keywords = db.Column(db.Text, nullable=True)
    sample_answer = db.Column(db.Text, nullable=True)

    answers = db.relationship('CandidateAnswer', backref='question', lazy=True, cascade="all, delete-orphan")
    evaluation = db.relationship('Evaluation', backref='question', uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'category': self.category,
            'difficulty': self.difficulty,
            'sample_answer': self.sample_answer
        }

class CandidateAnswer(db.Model):
    __tablename__ = 'candidate_answers'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('interview_questions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text_response = db.Column(db.Text, nullable=False)
    audio_used = db.Column(db.Boolean, default=False)
    response_time_seconds = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'text_response': self.text_response,
            'audio_used': self.audio_used,
            'response_time_seconds': self.response_time_seconds,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('interview_questions.id'), nullable=False)
    candidate_answer_id = db.Column(db.Integer, db.ForeignKey('candidate_answers.id'), nullable=True)
    accuracy_score = db.Column(db.Float, nullable=False, default=0.0)      # 0-100
    completeness_score = db.Column(db.Float, nullable=False, default=0.0)  # 0-100
    relevance_score = db.Column(db.Float, nullable=False, default=0.0)     # 0-100
    communication_score = db.Column(db.Float, nullable=False, default=0.0) # 0-100
    confidence_indicator = db.Column(db.String(50), nullable=True, default='Moderate') # High, Moderate, Low
    feedback_text = db.Column(db.Text, nullable=False)
    missed_points = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'accuracy_score': round(self.accuracy_score, 1),
            'completeness_score': round(self.completeness_score, 1),
            'relevance_score': round(self.relevance_score, 1),
            'communication_score': round(self.communication_score, 1),
            'confidence_indicator': self.confidence_indicator,
            'overall_question_score': round((self.accuracy_score * 0.4 + self.completeness_score * 0.3 + self.relevance_score * 0.2 + self.communication_score * 0.1), 1),
            'feedback_text': self.feedback_text,
            'missed_points': self.missed_points.split(';') if self.missed_points else []
        }

class InterviewReport(db.Model):
    __tablename__ = 'interview_reports'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    overall_score = db.Column(db.Float, nullable=False, default=0.0)
    strengths_json = db.Column(db.Text, nullable=True)        # JSON string list
    weaknesses_json = db.Column(db.Text, nullable=True)       # JSON string list
    missed_questions_json = db.Column(db.Text, nullable=True) # JSON string list
    improvement_plan_json = db.Column(db.Text, nullable=True)# JSON string list
    category_breakdown_json = db.Column(db.Text, nullable=True) # JSON object string
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'session_id': self.session_id,
            'overall_score': round(self.overall_score, 1),
            'strengths': json.loads(self.strengths_json) if self.strengths_json else [],
            'weaknesses': json.loads(self.weaknesses_json) if self.weaknesses_json else [],
            'missed_questions': json.loads(self.missed_questions_json) if self.missed_questions_json else [],
            'improvement_plan': json.loads(self.improvement_plan_json) if self.improvement_plan_json else [],
            'category_breakdown': json.loads(self.category_breakdown_json) if self.category_breakdown_json else {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
