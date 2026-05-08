from flask import Blueprint, request, jsonify
from app.services.chatbot_service import ChatbotService

chatbot_bp = Blueprint("chatbot", __name__, url_prefix="/api/chatbot")

@chatbot_bp.route("/ask", methods=["POST"])
def ask_chatbot():
    try:
        data = request.json
        user_query = data.get("message")        
        chat_history = data.get("history", [])
        
        if not user_query:
            return jsonify({"message": "Message is required"}), 400

        # Gọi lớp Service xử lý
        reply_text = ChatbotService.get_chat_response(user_query, chat_history)

        return jsonify({"reply": reply_text}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400
    
        