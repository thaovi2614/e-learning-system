from flask import Blueprint, request, jsonify
from app.services.user_service import UserService
from app.middlewares.jwt_middleware import role_required

# Khai báo Blueprint
user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
@role_required('STUDENT', 'INSTRUCTOR', 'ADMIN')
def get_profile(current_user):
    """Lấy thông tin cá nhân của người dùng hiện tại"""
    # Sử dụng to_dict() từ model User để trả về đầy đủ thông tin[cite: 2]
    return jsonify(current_user.to_dict()), 200

@user_bp.route('/change-password', methods=['POST'])
@role_required('STUDENT', 'INSTRUCTOR', 'ADMIN')
def change_password(current_user):
    """Đổi mật khẩu người dùng"""
    data = request.json
    
    # Kiểm tra dữ liệu đầu vào cơ bản
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({"message": "Vui lòng nhập đầy đủ mật khẩu cũ và mới"}), 400

    # Gọi service xử lý logic đổi mật khẩu qua local import để tránh circular import[cite: 1]
    success, message = UserService.update_password(
        current_user.id, old_password, new_password
    )
    
    if not success:
        return jsonify({"message": message}), 400
        
    return jsonify({"message": message}), 200

@user_bp.route('/update-avatar', methods=['POST'])
@role_required('STUDENT', 'INSTRUCTOR', 'ADMIN')
def update_avatar(current_user):
    """Cập nhật ảnh đại diện người dùng"""
    # Kiểm tra xem có file gửi lên không
    if 'avatar' not in request.files:
        return jsonify({"message": "Không tìm thấy tệp tin ảnh"}), 400
        
    file = request.files['avatar']
    
    # Kiểm tra tên file trống
    if file.filename == '':
        return jsonify({"message": "Chưa chọn tệp tin"}), 400
        
    # Gọi service upload lên Cloudinary qua local import[cite: 1]
    new_avatar_url = UserService.update_avatar(current_user.id, file)
    
    if not new_avatar_url:
        return jsonify({"message": "Cập nhật ảnh thất bại"}), 500
        
    return jsonify({
        "message": "Cập nhật ảnh đại diện thành công",
        "avatar_url": new_avatar_url
    }), 200