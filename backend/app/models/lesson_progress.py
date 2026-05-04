from app.configs.database_config import db
from app.enums.lesson_progress_status import LessonProgressStatus
from sqlalchemy import Enum as SqlEnum

class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"

    __table_args__ = (
        db.UniqueConstraint('student_id', 'lesson_id', name='unique_progress'),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)

    status = db.Column(SqlEnum(LessonProgressStatus), nullable=False)