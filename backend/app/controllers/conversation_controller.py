from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User
import app.services.conversation_service as ConversationService

conversation_bp = Blueprint("conversation", __name__, url_prefix="/api/conversations")


@conversation_bp.route("/with/<int:user_id>", methods=["POST"])
@jwt_required()
def create_or_get_conversation(user_id):
    current_user = int(get_jwt_identity())

    if current_user == user_id:
        return jsonify({
            "success": False,
            "message": "Không thể chat với chính mình"
        }), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "message": "User không tồn tại"
        }), 404

    convo = ConversationService.get_or_create_conversation(current_user, user_id)

    return jsonify({
        "success": True,
        "data": {
            "id": convo.id,
            "user1_id": convo.user1_id,
            "user2_id": convo.user2_id
        }
    })


@conversation_bp.route("", methods=["GET"])
@jwt_required()
def get_conversations():
    current_user = int(get_jwt_identity())

    try:
        data = ConversationService.get_user_conversations(current_user)    

        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500