from app.models.user import User
from app.enums.user_role import UserRole
from app.configs.database_config import db
from app.utils.jwt_helper import generate_token
from flask_jwt_extended import set_access_cookies
from flask import jsonify

def register(data):
    user = User.query.filter_by(username=data.get("username")).first()
    if user:
        return {"message": "Người dùng đã tồn tại"}, 400
    
    user = User.query.filter_by(email=data.get("email")).first()
    if user:
        return {"message": "Email đã được sử dụng"}, 400
    
    role = UserRole.STUDENT

    if data.get("role"):
        try:
            role = UserRole(data.get("role"))
        except ValueError:
            return {"message": "Vai trò không hợp lệ"}, 400
        
        if role == UserRole.ADMIN:
            return {"message": "Không thể đăng ký vai trò admin"}, 403
        
    default_avatar = "https://res.cloudinary.com/dtopmydz5/image/upload/v1775117340/elearning/avatars/qxorlvoicsogojnjoykz.png"

    new_user = User(
        username = data.get("username"),
        email = data.get("email"),
        fullname=data.get("fullname", "").strip(),
        role = role,
        avatar = default_avatar,
    )
    new_user.set_password(data.get("password"))

    db.session.add(new_user)
    db.session.commit()

    return {"message": "Đăng ký thành công"}, 201

def login(username, password):
    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return {"message": "Tài khoản hoặc mật khẩu không chính xác!!!"}, 401
    
    token = generate_token(user)

    response = jsonify({
        "message": "Đăng nhập thành công",
        "token": token
    })

    set_access_cookies(response, token)

    return response, 200

def get_profile(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"message": "User không tồn tại"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
	"fullname": user.fullname,
        "avatar": user.avatar,
        "role": user.role.value
    })