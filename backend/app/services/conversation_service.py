from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.configs.database_config import db

def get_or_create_conversation(user1_id, user2_id):
    u1, u2 = sorted([user1_id, user2_id])

    convo = Conversation.query.filter_by(
        user1_id=u1,
        user2_id=u2
    ).first()

    if convo:
        return convo

    convo = Conversation(
        user1_id=u1,
        user2_id=u2
    )
    db.session.add(convo)
    db.session.commit()

    return convo


def get_user_conversations(user_id):
    conversations = Conversation.query.filter(
        (Conversation.user1_id == user_id) |
        (Conversation.user2_id == user_id)
    ).all()

    result = []

    for c in conversations:
        other_user_id = c.user2_id if c.user1_id == user_id else c.user1_id
        other_user = User.query.get(other_user_id)

        last_message = Message.query.filter_by(
            conversation_id=c.id
        ).order_by(Message.sentAt.desc()).first()

        unread_count = Message.query.filter(
            Message.conversation_id == c.id,
            Message.sender_id != user_id,
            Message.is_read.is_(False)
        ).count()

        result.append({
            "id": c.id,
            "other_user_id": other_user.id if other_user else "",
            "name": other_user.username if other_user else f"User {other_user_id}",
            "avatar": other_user.avatar if other_user else "",
            "unread_count": unread_count,
            "last_message": last_message.content if last_message else "",
            "last_time": last_message.sentAt.isoformat() if last_message else None,
            "last_sender_id": last_message.sender_id if last_message else None
        })

    return result