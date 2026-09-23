import os
import json
import random
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class AIService:
    @staticmethod
    def is_gemini_available():
        return bool(GEMINI_API_KEY and len(GEMINI_API_KEY.strip()) > 5)

    @staticmethod
    def generate_question(job_role_title, category, difficulty, question_number, asked_questions=None):
        """Generates a relevant interview question using Gemini API or fallback question bank."""
        if asked_questions is None:
            asked_questions = []

        if AIService.is_gemini_available():
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = (
                    f"You are an expert AI interviewer conducting a professional interview for a '{job_role_title}' role.\n"
                    f"Interview Type: {category}, Difficulty Level: {difficulty}, Question #{question_number}.\n"
                    f"Previously asked questions: {json.dumps(asked_questions)}\n"
                    f"Generate a brand new, highly relevant, realistic interview question.\n"
                    f"Respond ONLY with a JSON object in this exact format:\n"
                    f"{{\n"
                    f'  "question_text": "The full question text",\n'
                    f'  "category": "Specific sub-topic or domain",\n'
                    f'  "difficulty": "{difficulty}",\n'
                    f'  "expected_keywords": "comma, separated, key, technical, concepts",\n'
                    f'  "sample_answer": "A model answer highlighting main points"\n'
                    f"}}\n"
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                data = json.loads(raw_text.strip())
                return data
            except Exception as e:
                print(f"[AI SERVICE WARNING] Gemini API call failed ({e}). Using intelligent fallback.")

        # Fallback question generation logic
        from seed_data import QUESTION_BANK
        role_questions = QUESTION_BANK.get(job_role_title, QUESTION_BANK.get("Python Developer"))
        
        # Filter out already asked questions if possible
        available = [q for q in role_questions if q["question_text"] not in asked_questions]
        if not available:
            available = role_questions

        q_item = random.choice(available)
        return {
            "question_text": q_item["question_text"],
            "category": q_item.get("category", category),
            "difficulty": difficulty,
            "expected_keywords": q_item.get("expected_keywords", "key concepts, best practices"),
            "sample_answer": q_item.get("sample_answer", "Candidate should cover basic principles, syntax, and real-world applications.")
        }

    @staticmethod
    def evaluate_answer(question_text, candidate_answer_text, expected_keywords, sample_answer, response_time_seconds, audio_used=False):
        """Evaluates candidate response across Accuracy, Completeness, Relevance, Communication, and Confidence."""
        word_count = len(candidate_answer_text.strip().split())

        if AIService.is_gemini_available():
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = (
                    f"You are a strict, fair AI Technical Interview Evaluator.\n"
                    f"Question: {question_text}\n"
                    f"Expected Keywords/Concepts: {expected_keywords}\n"
                    f"Sample Model Answer: {sample_answer}\n"
                    f"Candidate Answer: '{candidate_answer_text}'\n"
                    f"Answered via Speech-to-Text: {audio_used}, Time Taken: {response_time_seconds}s, Word Count: {word_count}\n\n"
                    f"Evaluate the candidate's answer carefully on a 0-100 scale for each criterion:\n"
                    f"1. accuracy_score (0-100): Technical correctness\n"
                    f"2. completeness_score (0-100): Depth and covering essential points\n"
                    f"3. relevance_score (0-100): Direct addressing of question without fluff\n"
                    f"4. communication_score (0-100): Clarity, structure, and articulate presentation\n"
                    f"5. confidence_indicator: 'High', 'Moderate', or 'Needs Work' (derived from response length, vocabulary, and flow)\n"
                    f"6. feedback_text: 2-3 sentences of actionable, constructive feedback\n"
                    f"7. missed_points: List of key concepts or points that were missed or could be improved\n\n"
                    f"Respond ONLY in valid JSON matching this schema:\n"
                    f"{{\n"
                    f'  "accuracy_score": 85.0,\n'
                    f'  "completeness_score": 80.0,\n'
                    f'  "relevance_score": 90.0,\n'
                    f'  "communication_score": 88.0,\n'
                    f'  "confidence_indicator": "High",\n'
                    f'  "feedback_text": "Good technical understanding shown...",\n'
                    f'  "missed_points": ["Point 1", "Point 2"]\n'
                    f"}}\n"
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                data = json.loads(raw_text.strip())
                return data
            except Exception as e:
                print(f"[AI EVALUATION WARNING] Gemini API call failed ({e}). Using rule-based fallback.")

        # Rule-based fallback evaluation engine
        keywords_list = [k.strip().lower() for k in expected_keywords.split(',') if k.strip()]
        answer_lower = candidate_answer_text.lower()

        # 1. Accuracy & Keywords Match
        matched_keywords = [k for k in keywords_list if k in answer_lower]
        keyword_ratio = len(matched_keywords) / max(len(keywords_list), 1)

        if word_count < 5:
            accuracy_score = 20.0
            completeness_score = 15.0
            relevance_score = 30.0
            communication_score = 25.0
            confidence_indicator = "Low"
            feedback_text = "The answer was very brief and did not provide sufficient technical explanation."
            missed_points = ["Detailed explanation", "Technical concepts", "Real-world examples"]
        elif word_count < 20:
            accuracy_score = round(40.0 + keyword_ratio * 40, 1)
            completeness_score = 50.0
            relevance_score = 70.0
            communication_score = 65.0
            confidence_indicator = "Moderate"
            feedback_text = "You touched on some basic concepts, but the answer lacked depth and key technical details."
            missed_points = ["Deeper explanation of mechanics", "Edge cases or usage scenarios"]
        else:
            base_score = 65.0 + (keyword_ratio * 30.0)
            accuracy_score = min(round(base_score, 1), 96.0)
            completeness_score = min(round(60.0 + (word_count / 150.0 * 35.0), 1), 95.0)
            relevance_score = min(round(75.0 + (keyword_ratio * 20.0), 1), 98.0)
            communication_score = min(round(70.0 + (10 if audio_used else 5) + (min(word_count, 100) / 5), 1), 95.0)
            confidence_indicator = "High" if (word_count > 35 and keyword_ratio > 0.4) else "Moderate"
            
            feedback_text = f"Good overall response! You correctly addressed key terms ({', '.join(matched_keywords) if matched_keywords else 'fundamental concepts'})."
            missed_points = [f"Mentioning additional keywords: {', '.join([k for k in keywords_list if k not in matched_keywords][:2])}"] if len(matched_keywords) < len(keywords_list) else ["None! Excellent coverage."]

        return {
            "accuracy_score": accuracy_score,
            "completeness_score": completeness_score,
            "relevance_score": relevance_score,
            "communication_score": communication_score,
            "confidence_indicator": confidence_indicator,
            "feedback_text": feedback_text,
            "missed_points": missed_points
        }

    @staticmethod
    def generate_final_report(session, questions_and_evaluations):
        """Generates comprehensive final performance report dashboard data."""
        if not questions_and_evaluations:
            return {
                "overall_score": 0.0,
                "strengths": ["Completed interview session"],
                "weaknesses": ["No questions answered"],
                "missed_questions": [],
                "improvement_plan": ["Attempt interview questions next time"],
                "category_breakdown": {}
            }

        total_accuracy = sum(item["eval"]["accuracy_score"] for item in questions_and_evaluations)
        total_completeness = sum(item["eval"]["completeness_score"] for item in questions_and_evaluations)
        total_relevance = sum(item["eval"]["relevance_score"] for item in questions_and_evaluations)
        total_comm = sum(item["eval"]["communication_score"] for item in questions_and_evaluations)
        n = len(questions_and_evaluations)

        avg_accuracy = round(total_accuracy / n, 1)
        avg_completeness = round(total_completeness / n, 1)
        avg_relevance = round(total_relevance / n, 1)
        avg_comm = round(total_comm / n, 1)

        overall_score = round(
            (avg_accuracy * 0.4) + (avg_completeness * 0.3) + (avg_relevance * 0.2) + (avg_comm * 0.1), 1
        )

        strengths = []
        weaknesses = []
        improvement_plan = []

        if avg_accuracy >= 75:
            strengths.append("Strong technical accuracy and subject matter understanding.")
        else:
            weaknesses.append("Technical accuracy needs refinement on fundamental definitions.")
            improvement_plan.append(f"Review core principles for {session.job_role.title}.")

        if avg_completeness >= 75:
            strengths.append("Thorough and comprehensive answers covering multiple perspectives.")
        else:
            weaknesses.append("Answers were somewhat brief or omitted key edge cases.")
            improvement_plan.append("Use the STAR or structured framework to provide more detailed responses.")

        if avg_relevance >= 80:
            strengths.append("Excellent focus—directly answered questions without off-topic tangents.")

        if avg_comm >= 80:
            strengths.append("Clear articulation and confident communication structure.")
        else:
            improvement_plan.append("Practice speaking out loud or recording answers to build verbal clarity.")

        missed_questions = []
        for item in questions_and_evaluations:
            q_score = (item["eval"]["accuracy_score"] * 0.4) + (item["eval"]["completeness_score"] * 0.3) + (item["eval"]["relevance_score"] * 0.3)
            if q_score < 70:
                missed_questions.append({
                    "question_text": item["question"]["question_text"],
                    "score": round(q_score, 1),
                    "feedback": item["eval"]["feedback_text"],
                    "missed_points": item["eval"].get("missed_points", [])
                })

        category_breakdown = {
            "Technical Accuracy": avg_accuracy,
            "Completeness": avg_completeness,
            "Relevance": avg_relevance,
            "Communication": avg_comm
        }

        return {
            "overall_score": overall_score,
            "strengths": strengths if strengths else ["Good effort and completion of all questions."],
            "weaknesses": weaknesses if weaknesses else ["Minor technical terminology gaps."],
            "missed_questions": missed_questions,
            "improvement_plan": improvement_plan if improvement_plan else ["Maintain regular interview practice."],
            "category_breakdown": category_breakdown
        }
