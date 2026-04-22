from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.payment_service import create_payment, handle_momo_ipn

payment_bp = Blueprint("payment", __name__, url_prefix="/api/payments")


@payment_bp.route("/momo/create", methods=["POST"])
@jwt_required()
def create_momo():
    user_id = get_jwt_identity()
    data    = request.get_json()

    if not data:
        return jsonify({"message": "Thiếu dữ liệu"}), 400

    course_id = data.get("course_id")
    if not course_id:
        return jsonify({"message": "Thiếu course_id"}), 400

    res, code = create_payment(user_id, course_id)
    return jsonify(res), code


@payment_bp.route("/momo/ipn", methods=["POST"])
def momo_ipn():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Thiếu dữ liệu IPN"}), 400

    res, code = handle_momo_ipn(data)
    return jsonify(res), code

