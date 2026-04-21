from app.configs.database_config import db
from app.models.lesson import Lesson

class VideoLesson(Lesson):
    __tablename__ = "video_lessons"

    id = db.Column(db.Integer, db.ForeignKey("lessons.id"), primary_key=True)
    videoUrl = db.Column(db.String(255), nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "video"
    }