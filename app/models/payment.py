from app.configs.database_config import db
from sqlalchemy import Numeric
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.sql import func
from app.enums.payment_status import PaymentStatus

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    transaction_id = db.Column(db.String(100), unique=True)
    gateway_trans_id = db.Column(db.String(100))
    total_price = db.Column(Numeric(10, 2), nullable=False)

    status = db.Column(SqlEnum(PaymentStatus), default=PaymentStatus.PENDING)
    method = db.Column(db.String(20))

    created_at = db.Column(db.DateTime, server_default=func.now())