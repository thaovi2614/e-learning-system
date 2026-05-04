from app.configs.database_config import db
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.models.quiz_attempt import QuizAttempt
from app.models.lesson_progress import LessonProgress
from app.enums.lesson_progress_status import LessonProgressStatus

def find_quiz_by_id(quiz_id):
    quiz = Quiz.query.get(quiz_id)

    if not quiz:
        raise Exception("Quiz không tồn tại")

    return quiz


def get_quiz_detail(quiz_id):
    quiz = Quiz.query.get(quiz_id)

    if not quiz:
        raise Exception("Quiz không tồn tại")

    return {
        "id": quiz.id,
        "timeLimit": quiz.timeLimit,
        "passScore": quiz.passScore,
        "lesson_id": quiz.lesson_id,
        "course_id": quiz.lesson.chapter.course_id,
        "quizQuestions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "optionA": q.optionA,
                "optionB": q.optionB,
                "optionC": q.optionC,
                "optionD": q.optionD,
            }
            for q in quiz.quizQuestions
        ]
    }


def submit_quiz(quiz_id, student_id, answers):
    quiz = Quiz.query.get(quiz_id)

    if not quiz:
        raise Exception("Quiz không tồn tại")

    correct_count = 0

    for q in quiz.quizQuestions:
        user_answer = answers.get(str(q.id)) or answers.get(q.id)

        if user_answer and user_answer == q.correct_answer.name:
            correct_count += 1

    total = len(quiz.quizQuestions)

    score = (correct_count / total) * 10 if total > 0 else 0
    score = round(score, 2)

    passed = score >= quiz.passScore

    attempt = QuizAttempt.query.filter_by(
        student_id=student_id,
        quiz_id=quiz_id
    ).first()

    if attempt and attempt.score >= quiz.passScore:
        raise Exception("Bạn đã đạt bài này rồi, không thể làm lại")

    if not attempt:
        attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=score
        )
        db.session.add(attempt)

    else:
        if score > attempt.score:
            attempt.score = score

    if passed:
        progress = LessonProgress.query.filter_by(
            student_id=student_id,
            lesson_id=quiz.lesson_id
        ).first()

        if progress:
            progress.status = LessonProgressStatus.COMPLETED

    db.session.commit()

    return {
        "score": score,
        "total": total,
        "correct": correct_count,
        "passed": passed
    }


def get_best_score(quiz_id, student_id):
    best_attempt = QuizAttempt.query.filter_by(
        student_id=student_id,
        quiz_id=quiz_id
    ).first()

    if best_attempt:
        return best_attempt.score
    else :
        return None