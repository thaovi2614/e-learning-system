from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models.enrollment import Enrollment

enrollment_bp = Blueprint("enrollment", __name__, url_prefix="/api/enrollments")


@enrollment_bp.route("", methods=["GET"])
@jwt_required()
def get_my_enrollments():
    user_id = get_jwt_identity()

    enrollments = Enrollment.query.filter_by(user_id=user_id).all()

    result = []
    for e in enrollments:
        result.append({
            "id": e.id,
            "user_id": e.user_id,
            "course_id": e.course_id,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })

    return jsonify(result), 200


@enrollment_bp.route("/check/<int:course_id>", methods=["GET"])
@jwt_required()
def check_enrollment(course_id):
    user_id = get_jwt_identity()

    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    return jsonify({
        "enrolled": enrollment is not None,
        "status": enrollment.status if enrollment else None
    }), 200