import os
from werkzeug.security import generate_password_hash, check_password_hash
import cloudinary.uploader 

class UserService:
    @staticmethod
    def get_user_profile(user_id):
        # Local import để tránh circular import
        from app.models.user import User
        return User.query.get(user_id)

    @staticmethod
    def update_password(user_id, old_password, new_password):
        # SỬA LỖI Ở ĐÂY: Import db từ app.configs.database_config thay vì từ app[cite: 4]
        from app.configs.database_config import db
        from app.models.user import User
        
        user = User.query.get(user_id)
        if not user:
            return False, "Người dùng không tồn tại"
            
        if not check_password_hash(user.password, old_password):
            return False, "Mật khẩu cũ không chính xác"
            
        user.password = generate_password_hash(new_password)
        db.session.commit()
        return True, "Đổi mật khẩu thành công"

    @staticmethod
    def update_avatar(user_id, file):
        # SỬA LỖI Ở ĐÂY: Tương tự, import db từ app.configs.database_config[cite: 4]
        from app.configs.database_config import db
        from app.models.user import User
        
        user = User.query.get(user_id)
        if not user:
            return None
            
        # Upload lên Cloudinary (dựa trên backend/app/configs/cloudinary_config.py)
        upload_result = cloudinary.uploader.upload(file)
        user.avatar = upload_result['secure_url']
        db.session.commit()
        return user.avatar