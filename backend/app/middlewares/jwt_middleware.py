from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in roles:
                return {"message": "Không có quyền"}, 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper