from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.middlewares.jwt_middleware import role_required
import app.services.category_service as CategoryService
import app.services.user_service as UserService

category_bp = Blueprint("category", __name__, url_prefix="/api/categories")


@category_bp.route("/<int:id>", methods=["GET"])
def get_by_id(id):
    category = CategoryService.find_category_by_id(id)
    return jsonify(category.to_dict()), 200

@category_bp.route("/by-slug")
def get_by_slug():
    slug_path = request.args.get("slug")

    category = CategoryService.find_category_by_slug_path(slug_path)

    if not category:
        return jsonify({"message": "Không tìm thấy"}), 404

    return jsonify(category.to_dict())


@category_bp.route("", methods=["GET"])
def get_categories():
    data = request.args.to_dict()

    user = None

    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()

        if user_id:
            user = UserService.find_user_by_id(int(user_id))
    except:
        user = None

    is_admin = user and user.role.name == "ADMIN"

    categories = CategoryService.find_category(data, is_admin)

    return jsonify([c.to_dict() for c in categories]), 200


@category_bp.route("/tree", methods=["GET"])
def get_tree():
    data = CategoryService.build_tree_with_level()
    return jsonify(data), 200


@category_bp.route("", methods=["POST"])
@role_required("ADMIN")
def add_category():
    data = request.get_json()

    category = CategoryService.add_category(data)
    return jsonify(category.to_dict()), 201


@category_bp.route("/<int:id>", methods=["PUT"])
@role_required("ADMIN")
def update_category(id):
    data = request.get_json()

    category = CategoryService.update_category(id, data)
    return jsonify(category.to_dict()), 200