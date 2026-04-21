from app.configs.database_config import db
from sqlalchemy import Numeric

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey("enrollments.id"), nullable=False)

    transaction_id = db.Column(db.String(100), unique=True)
    price = db.Column(Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    method = db.Column(db.String(20))
    created_at = db.Column(db.DateTime)