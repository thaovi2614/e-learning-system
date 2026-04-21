from app.configs.database_config import db
from app.enums.lesson_type import LessonType
from sqlalchemy import Enum as SqlEnum

class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(SqlEnum(LessonType), nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)

    chapter_id = db.Column(db.Integer, db.ForeignKey("chapters.id"), nullable=False)

    __mapper_args__ = {
        "polymorphic_on": type,
        "polymorphic_identity": "lesson"
    }