from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, unset_jwt_cookies
import app.services.auth_service as AuthService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    return AuthService.register(data)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    return AuthService.login(
        data.get("username"),
        data.get("password")
    )

@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Đăng xuất"})
    unset_jwt_cookies(response)
    return response, 200

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    return AuthService.get_profile(user_id)