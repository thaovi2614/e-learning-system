from app.configs.database_config import db
from sqlalchemy.sql import func

class Enrollment(db.Model):
    __tablename__ = "enrollments"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    created_at = db.Column(db.DateTime, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint('user_id', 'course_id', name='unique_enrollment'),
    )

    def to_dict(e):
        return {
            "id": e.id,
            "user_id": e.user_id,
            "course_id": e.course_id,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }