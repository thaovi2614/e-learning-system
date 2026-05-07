from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import app.services.enrollment_service as EnrollmentService 

from app.models.enrollment import Enrollment

enrollment_bp = Blueprint("enrollment", __name__, url_prefix="/api/enrollments")


@enrollment_bp.route("", methods=["GET"])
@jwt_required()
def get_my_enrollments():
    user_id = get_jwt_identity()

    result = EnrollmentService.find_enrollment_by_user_id(user_id)

    return jsonify(result), 200


@enrollment_bp.route("/check/<int:course_id>", methods=["GET"])
@jwt_required()
def check_enrollment(course_id):
    user_id = int(get_jwt_identity())

    enrollment = EnrollmentService.find_enrollment_by_user_and_course(user_id, course_id)

    return jsonify({
        "enrolled": enrollment is not None,
        "enrollment": enrollment.to_dict() if enrollment else None
    }), 200


@enrollment_bp.route("", methods=["POST"])
@jwt_required()
def create_enrollment():
    user_id = get_jwt_identity()
    course_id = request.args.get("course_id", type=int)

    if not course_id:
        return jsonify({"error": "Thiếu course_id"}), 400

    try:
        enrollment = EnrollmentService.add_single_enrollment(user_id, course_id)
        return jsonify({"success": True, "data": enrollment.to_dict()}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except Exception:
        return jsonify({"error": "Có lỗi xảy ra"}), 500