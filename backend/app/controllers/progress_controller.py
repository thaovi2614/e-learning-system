from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import app.services.lesson_progress_service as ProgressService

progress_bp = Blueprint("progress", __name__, url_prefix="/api/progress")


@progress_bp.route("/detail/<int:course_id>", methods=["GET"])
@jwt_required()
def get_progress_detail(course_id):
    user_id = int(get_jwt_identity())

    data = ProgressService.get_progress_detail(user_id, course_id)

    return jsonify(data), 200


@progress_bp.route("/<int:course_id>", methods=["GET"])
@jwt_required()
def get_progress(course_id):
    try:
        user_id = int(get_jwt_identity())

        percent = ProgressService.get_progress_percent(user_id, course_id)

        return jsonify({
            "course_id": course_id,
            "progress_percent": percent
        }), 200

    except Exception as e:
        return jsonify({
            "message": str(e)
        }), 400


@progress_bp.route("/start/<int:lesson_id>", methods=["POST"])
@jwt_required()
def start_lesson_api(lesson_id):
    try:
        user_id = int(get_jwt_identity())

        progress = ProgressService.start_lesson(user_id, lesson_id)

        return jsonify({
            "lesson_id": lesson_id,
            "status": progress.status.value
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@progress_bp.route("/complete/<int:lesson_id>", methods=["POST"])
@jwt_required()
def complete_lesson(lesson_id):
    try:
        user_id = int(get_jwt_identity())

        ProgressService.complete_lesson(user_id, lesson_id)

        return jsonify({"message": "Đã hoàn thành bài học"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400