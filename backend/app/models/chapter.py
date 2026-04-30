from app.configs.database_config import db
from sqlalchemy.orm import relationship

class Chapter(db.Model):
    __tablename__ = "chapters"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)

    order_index = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)

    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    lessons = relationship(
        "Lesson",
        backref="chapter",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "order_index": self.order_index,
            "active": self.active,
            "course_id": self.course_id,
            "lessons": [l.to_dict() for l in self.lessons if l.active]
        }