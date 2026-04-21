from app.configs.database_config import db
from app.enums.answer_quiz import AnswerQuize
from sqlalchemy import Enum as SqlEnum

class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id = db.Column(db.Integer, primary_key=True)

    question_text = db.Column(db.Text, nullable=False)

    optionA = db.Column(db.String(255), nullable=False)
    optionB = db.Column(db.String(255), nullable=False)
    optionC = db.Column(db.String(255), nullable=False)
    optionD = db.Column(db.String(255), nullable=False)

    correct_answer = db.Column(SqlEnum(AnswerQuize), nullable=False)

    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)