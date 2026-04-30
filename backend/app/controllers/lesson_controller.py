import traceback
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.middlewares.jwt_middleware import role_required
import app.services.lesson_service as LessonService

lesson_bp = Blueprint("lesson", __name__, url_prefix="/api")


@lesson_bp.route("/lessons/<int:id>", methods=["GET"])
@jwt_required()
def get_lesson_by_id(id):
    try:
        user_id = get_jwt_identity()

        lesson = LessonService.find_lesson_by_id(id)

        if not lesson:
            return jsonify({"message": "Lesson not found"}), 404

        if not LessonService.can_access_lesson(user_id, lesson):
            return jsonify({"message": "Bạn chưa đăng ký khóa học"}), 403

        return jsonify(lesson.to_dict()), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
        

@lesson_bp.route("/chapters/<int:chapter_id>/lessons", methods=["GET"])
def get_lessons_by_chapter(chapter_id):
    lessons = LessonService.get_lessons_by_chapter(chapter_id)
    return jsonify([lesson.to_dict() for lesson in lessons]), 200


@lesson_bp.route("/chapters/<int:chapter_id>/lessons", methods=["POST"])
@role_required("INSTRUCTOR")
def add_lesson(chapter_id):
    try:
        data = request.form.to_dict()
        file = request.files.get("file")
        user_id = int(get_jwt_identity())

        lesson = LessonService.add_lesson(data, file, user_id, chapter_id)

        return jsonify({
            "message": "Tạo bài học thành công",
            "data": lesson.to_dict()
        }), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@lesson_bp.route("/lessons/<int:lesson_id>", methods=["PUT"])
@role_required("INSTRUCTOR")
def update_lesson(lesson_id):
    try:
        data = request.form.to_dict()
        file = request.files.get("file")
        user_id = int(get_jwt_identity())

        lesson = LessonService.update_lesson(data, file, user_id, lesson_id)

        return jsonify({
            "message": "Cập nhật bài học thành công",
            "data": lesson.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@lesson_bp.route("/lessons/<int:lesson_id>", methods=["DELETE"])
@role_required("INSTRUCTOR")
def delete_lesson(lesson_id):
    try:
        user_id = int(get_jwt_identity())

        LessonService.delete_lesson(user_id, lesson_id)

        return jsonify({"message": "Đã xóa bài học"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400