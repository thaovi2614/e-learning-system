from app.models.user import User

def find_user_by_id(id):
    user = User.query.get(id)

    if user:
        return user
    else:
        raise Exception("Người dùng không tồn tại")