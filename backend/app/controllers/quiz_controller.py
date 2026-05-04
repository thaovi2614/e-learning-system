import traceback
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity 
import app.services.quiz_service as QuizService

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quizzes")

@quiz_bp.route("/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    try:
        quiz = QuizService.get_quiz_detail(quiz_id)

        return jsonify(quiz), 200

    except Exception as e:
        return jsonify({
            "message": str(e),
            "trace": traceback.format_exc()
        }), 400


@quiz_bp.route("/<int:quiz_id>/submit", methods=["POST"])
@jwt_required()
def submit_quiz(quiz_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        answers = data.get("answers", {})

        result = QuizService.submit_quiz(quiz_id, user_id, answers)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "message": str(e),
            "trace": traceback.format_exc()
        }), 400


@quiz_bp.route("/<int:quiz_id>/best-score", methods=["GET"])
@jwt_required()
def get_best_score(quiz_id):
    try:
        user_id = int(get_jwt_identity())

        score = QuizService.get_best_score(quiz_id, user_id)

        return jsonify({
            "best_score": score
        }), 200

    except Exception as e:
        return jsonify({
            "message": str(e),
            "trace": traceback.format_exc()
        }), 400 