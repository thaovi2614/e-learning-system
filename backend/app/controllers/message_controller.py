from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import app.services.message_service as MessageService 
import app.services.cloudinary_service as CloudinaryService

message_bp = Blueprint("message", __name__, url_prefix="/api/messages")


@message_bp.route("/<int:conversation_id>", methods=["GET"])
@jwt_required()
def get_messages(conversation_id):
    data = MessageService.get_messages_by_conversation(conversation_id)    

    return jsonify({
        "success": True,
        "data": data
    })


@message_bp.route("/read/<int:conversation_id>", methods=["PUT"])
@jwt_required()
def read_messages(conversation_id):
    current_user = int(get_jwt_identity())

    MessageService.mark_as_read(conversation_id, current_user)

    return jsonify({
        "success": True,
        "message": "Marked as read"
    })


@message_bp.route("/upload-image", methods=["POST"])
@jwt_required()
def upload_message_image():
    file = request.files.get("image")
    conversation_id = request.form.get("conversation_id")

    if not file or not conversation_id:
        return jsonify({"error": "Thiếu dữ liệu"}), 400

    image_url = CloudinaryService.upload_message_image(file, conversation_id)
    if not image_url:
        return jsonify({"error": "Upload thất bại"}), 500

    return jsonify({"image_url": image_url}), 200