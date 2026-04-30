from app.configs.database_config import db
from app.models.lesson import Lesson
from app.enums.lesson_type import LessonType

class VideoLesson(Lesson):
    __tablename__ = "video_lessons"

    id = db.Column(db.Integer, db.ForeignKey("lessons.id"), primary_key=True)
    videoUrl = db.Column(db.String(255), nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": LessonType.VIDEO
    }
    
    def to_dict(self):
        data = super().to_dict()
        data["videoUrl"] = self.videoUrl
        return data