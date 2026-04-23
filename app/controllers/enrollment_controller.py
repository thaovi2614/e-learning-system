from flask import Blueprint, jsonify
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
    user_id = get_jwt_identity()

    enrollment = EnrollmentService.find_enrollment_by_user_and_course(user_id, course_id)

    return jsonify({
        "enrolled": enrollment is not None,
        "status": enrollment.status if enrollment else None
    }), 200