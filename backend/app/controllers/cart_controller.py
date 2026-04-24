from flask import Blueprint, session, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.course import Course

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def build_cart_response(cart_ids):
    if not cart_ids:
        return {
            "items": [],
            "total": 0
        }

    courses = Course.query.filter(Course.id.in_(cart_ids)).all()

    items = [c.to_dict() for c in courses]
    total = sum(c.price for c in courses)

    return {
        "items": items,
        "total": total
    }


@cart_bp.route("", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    course_id = request.json.get("course_id")

    key = f"cart_{user_id}"
    carts = session.get(key, [])

    if course_id not in carts:
        carts.append(course_id)

    session[key] = carts

    return build_cart_response(carts), 200


@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = get_jwt_identity()
    key = f"cart_{user_id}"

    cart_ids = session.get(key, [])

    return build_cart_response(cart_ids), 200


@cart_bp.route("/<int:course_id>", methods=["DELETE"])
@jwt_required()
def remove_cart(course_id):
    user_id = get_jwt_identity()

    key = f"cart_{user_id}"
    carts = session.get(key, [])

    carts = [c for c in carts if c != course_id]
    session[key] = carts

    return build_cart_response(carts), 200


@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    user_id = get_jwt_identity()
    key = f"cart_{user_id}"
    
    session.pop(key, None)

    return {
        "items": [],
        "total": 0
    }, 200