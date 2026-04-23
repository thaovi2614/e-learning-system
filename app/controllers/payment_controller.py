from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.payment_service import create_payment, handle_momo_ipn

payment_bp = Blueprint("payment", __name__, url_prefix="/api/payments")


@payment_bp.route("/momo/create", methods=["POST"])
@jwt_required()
def create_momo():
    user_id = get_jwt_identity()

    key = f"cart_{user_id}"
    cart = session.get(key, [])
    
    res, code = create_payment(user_id, cart)
    
    return jsonify(res), code


@payment_bp.route("/momo/ipn", methods=["POST"])
def momo_ipn():
    data = request.get_json()
    
    if not data:
        return jsonify({"message": "Thiếu dữ liệu IPN"}), 400

    res, code = handle_momo_ipn(data)
    return jsonify(res), code
