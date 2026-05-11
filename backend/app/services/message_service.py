from datetime import datetime

from app.models.message import Message
from app.models.user import User
from app.configs.database_config import db
import app.services.cloudinary_service as CloudinaryService

def get_messages_by_conversation(conversation_id):
    messages = Message.query.filter_by(
        conversation_id=conversation_id
    ).order_by(Message.sentAt.asc()).all()

    data = []
    for m in messages:
        user = db.session.get(User, m.sender_id)
        data.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "avatar": user.avatar,
            "content": m.content,
            "image_url": m.image_url,
            "sentAt": m.sentAt.isoformat(),
            "is_read": m.is_read
        })

    return data


def create_message(conversation_id, sender_id, content=None, image_url=None):
    if not content and not image_url:
        raise ValueError("Phải có nội dung hoặc hình ảnh")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        image_url=image_url,
        sentAt = datetime.now()
    )
    db.session.add(msg)
    db.session.commit()
    return msg


def mark_as_read(conversation_id, user_id):
    Message.query.filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,
        Message.is_read == False
    ).update({"is_read": True})

    db.session.commit()