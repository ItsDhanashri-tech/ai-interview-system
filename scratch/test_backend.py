import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app import app, db, User, JobRole, InterviewSession, InterviewQuestion
from ai_service import AIService

def test_system():
    print("[TEST] Testing Flask backend app context...")
    with app.app_context():
        # Check Job Roles
        roles = JobRole.query.all()
        print(f"[TEST] Found {len(roles)} job roles in DB:")
        for r in roles:
            print(f"  - {r.title} ({r.category})")
        assert len(roles) > 0, "Job roles should be seeded!"

        # Check Demo User
        demo_user = User.query.filter_by(email="demo@candidate.com").first()
        print(f"[TEST] Demo User: {demo_user.name} ({demo_user.email})")
        assert demo_user is not None, "Demo user should exist!"

        # Test Question Generation
        q_data = AIService.generate_question("Python Developer", "Technical", "Medium", 1)
        print(f"[TEST] Generated Question: {q_data['question_text']}")
        assert "question_text" in q_data, "Question generation failed!"

        # Test Evaluation Engine
        eval_data = AIService.evaluate_answer(
            q_data['question_text'],
            "Deep copy creates a recursive copy of nested objects whereas shallow copy creates references.",
            q_data['expected_keywords'],
            q_data['sample_answer'],
            15,
            True
        )
        print(f"[TEST] Evaluation Score: {eval_data['accuracy_score']}% Accuracy, {eval_data['confidence_indicator']} Confidence")
        print(f"[TEST] Feedback: {eval_data['feedback_text']}")
        assert "accuracy_score" in eval_data, "Evaluation failed!"

    print("\n[SUCCESS] All backend component tests passed cleanly!")

if __name__ == "__main__":
    test_system()
