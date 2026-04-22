from app.configs.database_config import db
from sqlalchemy import Numeric
from datetime import datetime


class Payment(db.Model):
    __tablename__ = "payments"

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    course_id      = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    order_id       = db.Column(db.String(100), nullable=True, unique=True)
    request_id     = db.Column(db.String(100), nullable=True)
    transaction_id = db.Column(db.String(100), nullable=True, unique=True)

    price          = db.Column(Numeric(10, 2), nullable=False)
    status         = db.Column(db.String(20), nullable=False, default="PENDING")
    method         = db.Column(db.String(20), nullable=True)
    pay_url        = db.Column(db.Text, nullable=True)

    created_at     = db.Column(db.DateTime, default=datetime.utcnow)