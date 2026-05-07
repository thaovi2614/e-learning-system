from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
import app.services.payment_service as PaymentService

payment_bp = Blueprint("payment", __name__, url_prefix="/api/payments")


@payment_bp.route("/momo/create", methods=["POST"])
@jwt_required()
def create_momo():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    # Luồng mua ngay — truyền course_ids trực tiếp
    course_ids = data.get("course_ids")

    # Luồng giỏ hàng — lấy từ session
    if not course_ids:
        key = f"cart_{user_id}"
        course_ids = session.get(key, [])

    if not course_ids:
        return jsonify({"message": "Không có khóa học nào"}), 400

    res, code = PaymentService.create_payment(user_id, course_ids)
    return jsonify(res), code


@payment_bp.route("/momo/ipn", methods=["POST"])
def momo_ipn():
    data = request.get_json()
    
    if not data:
        return jsonify({"message": "Thiếu dữ liệu IPN"}), 400

    res, code = PaymentService.handle_momo_ipn(data)
    return jsonify(res), code
