from app.configs.socketIO_config import socketio
from flask_socketio import emit, join_room
from app.models.message import Message
from app.models.user import User
from app.configs.database_config import db
import app.services.message_service as MessageService

@socketio.on("connect")
def handle_connect():
    print("Client connected")


@socketio.on("join_conversation")
def handle_join(data):
    conversation_id = data["conversation_id"]
    join_room(str(conversation_id))


@socketio.on("send_message")
def handle_send_message(data):
    conversation_id = data["conversation_id"]
    sender_id = data["sender_id"]
    content = data.get("message")
    image_url = data.get("image_url")

    msg = MessageService.create_message(conversation_id, sender_id, content, image_url)

    user = User.query.get(sender_id)

    emit(
        "receive_message",
        {
            "id": msg.id,
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "content": content,
            "image_url": image_url,
            "avatar": user.avatar if user else "",
            "sentAt": str(msg.sentAt)
        },
        room=str(conversation_id)
    )


@socketio.on("typing")
def handle_typing(data):
    conversation_id = data["conversation_id"]
    user_id = data["user_id"]

    emit(
        "user_typing",
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        },
        room=str(conversation_id),
        include_self=False
    )


@socketio.on("stop_typing")
def handle_stop_typing(data):
    conversation_id = data["conversation_id"]
    user_id = data["user_id"]

    emit(
        "user_stop_typing",
        {
            "conversation_id": conversation_id,
            "user_id": user_id
        },
        room=str(conversation_id),
        include_self=False
    )