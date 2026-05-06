from app.configs.database_config import db
from sqlalchemy.sql import func

class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    sentAt = db.Column(db.DateTime, server_default=func.now())
    is_read = db.Column(db.Boolean, default=False)