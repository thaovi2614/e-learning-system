from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.middlewares.jwt_middleware import role_required
import app.services.chapter_service as ChapterService

chapter_bp = Blueprint("chapter", __name__, url_prefix="/api")


@chapter_bp.route("/courses/<int:course_id>/chapters", methods=["GET"])
def get_chapters_by_course(course_id):
    chapters = ChapterService.get_chapters_by_course(course_id)
    return jsonify([chapter.to_dict() for chapter in chapters]), 200


@chapter_bp.route("/courses/<int:course_id>/chapters", methods=["POST"])
@role_required("INSTRUCTOR")
def add_chapter(course_id):
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())

        chapter = ChapterService.add_chapter(data, user_id, course_id)

        return jsonify({
            "message": "Tạo chương thành công",
            "data": chapter.to_dict()
        }), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@chapter_bp.route("/chapters/<int:chapter_id>", methods=["PUT"])
@role_required("INSTRUCTOR")
def update_chapter(chapter_id):
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())

        chapter = ChapterService.update_chapter(data, user_id, chapter_id)

        return jsonify({
            "message": "Cập nhật chương thành công",
            "data": chapter.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@chapter_bp.route("/courses/<int:course_id>/chapters/<int:chapter_id>", methods=["DELETE"])
@role_required("INSTRUCTOR")
def delete_chapter(course_id, chapter_id):
    try:
        user_id = int(get_jwt_identity())

        ChapterService.delete_chapter(user_id, course_id, chapter_id)

        return jsonify({"message": "Đã xóa chương"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400