from app.configs.database_config import db

class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    timeLimit = db.Column(db.Integer, nullable=False)
    passScore = db.Column(db.Float, nullable=False)

    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)

    quizQuestions = db.relationship(
        "QuizQuestion",
        backref="quiz",
        cascade="all, delete-orphan"
    )