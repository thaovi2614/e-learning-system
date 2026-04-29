from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from functools import wraps
from flask import jsonify

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in roles:
                return jsonify({"message": "Không có quyền truy cập"}), 403

            # --- PHẦN BỔ SUNG ĐỂ SỬA LỖI 500 ---
            # Lấy ID của user từ token (identity)
            user_id = get_jwt_identity()
            
            # Local import để tránh lỗi Circular Import
            from app.models.user import User 
            current_user = User.query.get(user_id)

            if not current_user:
                return jsonify({"message": "Người dùng không tồn tại"}), 401

            # Truyền current_user vào hàm Controller (get_profile, change_password, update_avatar)
            return fn(current_user, *args, **kwargs)
            # -----------------------------------
            
        return decorator
    return wrapper