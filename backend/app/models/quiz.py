from app.configs.database_config import db


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    timeLimit = db.Column(db.Integer, nullable=False, default=0)
    passScore = db.Column(db.Float, nullable=False, default=0)

    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)

    lesson = db.relationship(
        "Lesson",
        backref=db.backref("quiz", uselist=False, cascade="all, delete-orphan")
    )

    quizQuestions = db.relationship(
        "QuizQuestion",
        backref="quiz",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timeLimit": self.timeLimit,
            "passScore": self.passScore,
            "lesson_id": self.lesson_id,
        }