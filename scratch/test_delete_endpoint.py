import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app, db, User, JobRole, InterviewSession, InterviewQuestion

def test_delete():
    print("[TEST] Testing DELETE /api/interviews/<session_id> endpoint...")
    with app.app_context():
        # Get demo user & a job role
        demo_user = User.query.filter_by(email="demo@candidate.com").first()
        job_role = JobRole.query.first()
        assert demo_user is not None and job_role is not None

        # Create a dummy interview session
        session = InterviewSession(
            user_id=demo_user.id,
            job_role_id=job_role.id,
            interview_type="Technical",
            difficulty="Medium",
            question_count=3,
            status="in_progress"
        )
        db.session.add(session)
        db.session.commit()

        # Add a question to verify cascading delete
        q = InterviewQuestion(
            session_id=session.id,
            question_number=1,
            question_text="Test question for deletion?",
            category="Technical",
            difficulty="Medium"
        )
        db.session.add(q)
        db.session.commit()

        session_id = session.id
        print(f"[TEST] Created dummy session ID={session_id}")

        # Test API using Flask test client
        with app.test_client() as client:
            from app import generate_token
            token = generate_token(demo_user.id)
            headers = {'Authorization': f'Bearer {token}'}

            # 1. Attempt delete
            response = client.delete(f'/api/interviews/{session_id}', headers=headers)
            print(f"[TEST] Delete response code: {response.status_code}")
            print(f"[TEST] Delete response json: {response.get_json()}")
            assert response.status_code == 200
            assert response.get_json()['message'] == 'Interview history deleted successfully.'

            # 2. Verify record deleted from database
            deleted_session = InterviewSession.query.get(session_id)
            deleted_question = InterviewQuestion.query.filter_by(session_id=session_id).first()
            assert deleted_session is None, "Session should be deleted!"
            assert deleted_question is None, "Cascaded question should be deleted!"

            # 3. Attempt deleting non-existent/already deleted session -> expect 404
            res_404 = client.delete(f'/api/interviews/{session_id}', headers=headers)
            print(f"[TEST] Re-delete response code (expected 404): {res_404.status_code}")
            assert res_404.status_code == 404
            assert res_404.get_json()['message'] == 'Interview session not found.'

    print("\n[SUCCESS] DELETE endpoint tests passed perfectly!")

if __name__ == "__main__":
    test_delete()
