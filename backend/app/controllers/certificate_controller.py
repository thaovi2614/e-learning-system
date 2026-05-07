from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import app.services.certificate_service as CertificateService

certificate_bp = Blueprint("certificate", __name__, url_prefix="/api/certificates")


@certificate_bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_required()
def get_certificate(course_id):
    user_id = int(get_jwt_identity())

    certificate = CertificateService.get_certificate_by_course(user_id, course_id)

    if not certificate:
        return jsonify({
            "message": "Chưa có chứng nhận cho khóa học này"
        }), 404

    return jsonify(certificate), 200