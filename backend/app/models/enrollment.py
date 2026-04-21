from app.configs.database_config import db

class Enrollment(db.Model):
    __tablename__ = "enrollments"

    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default="ACTIVE")
    created_at = db.Column(db.DateTime)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    payments = db.relationship("Payment", backref="enrollment", lazy=True)