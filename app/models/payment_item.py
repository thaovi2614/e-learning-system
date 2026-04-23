from app.configs.database_config import db
from sqlalchemy.sql import func
from sqlalchemy import Numeric

class PaymentItem(db.Model):
    __tablename__ = "payment_items"

    id = db.Column(db.Integer, primary_key=True)

    payment_id = db.Column(db.Integer, db.ForeignKey("payments.id"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)

    price = db.Column(Numeric(10, 2), nullable=False)

    created_at = db.Column(db.DateTime, server_default=func.now())