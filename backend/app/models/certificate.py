from app.configs.database_config import db
from sqlalchemy.sql import func

class Certificate(db.Model):
    __tablename__ = "certificates"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    certificate_code = db.Column(db.String(50), unique=True, nullable=False)
    issued_at = db.Column(db.DateTime, server_default=func.now())

    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="unique_certificate"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "course_id": self.course_id,
            "certificate_code": self.certificate_code,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None
        }