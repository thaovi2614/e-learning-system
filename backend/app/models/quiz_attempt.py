from app.configs.database_config import db
from sqlalchemy.sql import func

class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)

    score = db.Column(db.Float, nullable=False)
    submittedAt = db.Column(db.DateTime, server_default=func.now())