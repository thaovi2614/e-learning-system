# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
# from app.middlewares.jwt_middleware import role_required
# import app.services.course_service as CourseService
# import app.services.user_service as UserService

# course_bp = Blueprint("course", __name__, url_prefix="/api/courses")

# @course_bp.route("/<int:id>", methods=["GET"])
# def get_by_id(id):
#     course = CourseService.find_course_by_id(id)
#     return jsonify(course.to_dict()), 200

# @course_bp.route("", methods=["GET"])
# def get_courses():
#     data = request.args.to_dict()

#     user = None

#     try:
#         verify_jwt_in_request(optional=True)
#         user_id = get_jwt_identity()

#         if user_id:
#             user = UserService.find_user_by_id(int(user_id))
#     except:
#         user = None

#     is_admin = user and user.role.name == "ADMIN"

#     result = CourseService.find_courses(data, is_admin)

#     return jsonify({
#         "items": [c.to_dict() for c in result["items"]],
#         "page": result["page"],
#         "size": result["size"],
#         "total": result["total"],
#         "total_pages": result["total_pages"]
#     }), 200

# @course_bp.route("/my-courses", methods=["GET"])
# @jwt_required()
# def get_my_courses():
#     data = request.args.to_dict()

#     user_id = get_jwt_identity()

#     result = CourseService.get_my_courses(data, user_id)

#     return jsonify({
#         "items": [c.to_dict() for c in result["items"]],
#         "page": result["page"],
#         "size": result["size"],
#         "total": result["total"],
#         "total_pages": result["total_pages"]
#     })

# @course_bp.route("", methods=["POST"])
# @role_required("INSTRUCTOR")
# def add_course():
#     data = request.get_json()

#     user_id = get_jwt_identity()

#     course = CourseService.add_course(data, user_id)
#     return jsonify(course.to_dict()), 201

# @course_bp.route("/<int:id>", methods=["PUT"])
# @role_required("INSTRUCTOR")
# def update_course(id):
#     data = request.get_json()

#     user_id = get_jwt_identity()

#     course = CourseService.update_course(data, user_id, id)
#     return jsonify(course.to_dict()), 200

# @course_bp.route("/<int:id>", methods=["DELETE"])
# @role_required("INSTRUCTOR")
# def delete_course(id):
#     user_id = get_jwt_identity()

#     CourseService.delete_course(user_id, id)
#     return jsonify({"message": "Đã xóa khóa học"}), 200
# @course_bp.route("/manage", methods=["GET"])
# @role_required("INSTRUCTOR")
# def get_manage_courses():
#     user_id = int(get_jwt_identity())

#     courses = CourseService.find_my_courses(user_id)

#     return jsonify({
#         "items": [c.to_dict() for c in courses],
#         "page": 1,
#         "size": len(courses),
#         "total": len(courses),
#         "total_pages": 1
#     }), 200


from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
from app.middlewares.jwt_middleware import role_required
import app.services.course_service as CourseService
import app.services.user_service as UserService

course_bp = Blueprint("course", __name__, url_prefix="/api/courses")


@course_bp.route("/manage", methods=["GET"])
@role_required("INSTRUCTOR")
def get_manage_courses():
    try:
        user_id = int(get_jwt_identity())
        courses = CourseService.find_my_courses(user_id)

        return jsonify({
            "items": [c.to_dict() for c in courses],
            "page": 1,
            "size": len(courses),
            "total": len(courses),
            "total_pages": 1
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("/my-courses", methods=["GET"])
@jwt_required()
def get_my_courses():
    try:
        data = request.args.to_dict()
        user_id = int(get_jwt_identity())

        result = CourseService.get_my_courses(data, user_id)

        return jsonify({
            "items": [c.to_dict() for c in result["items"]],
            "page": result["page"],
            "size": result["size"],
            "total": result["total"],
            "total_pages": result["total_pages"]
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("/<int:id>", methods=["GET"])
def get_by_id(id):
    try:
        course = CourseService.find_course_by_id(id)

        if not course:
            return jsonify({"message": "Khóa học không tồn tại"}), 404

        return jsonify(course.to_dict()), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("", methods=["GET"])
def get_courses():
    try:
        data = request.args.to_dict()
        user = None

        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()

            if user_id:
                user = UserService.find_user_by_id(int(user_id))
        except Exception:
            user = None

        is_admin = user and user.role.name == "ADMIN"
        result = CourseService.find_courses(data, is_admin)

        return jsonify({
            "items": [c.to_dict() for c in result["items"]],
            "page": result["page"],
            "size": result["size"],
            "total": result["total"],
            "total_pages": result["total_pages"]
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("", methods=["POST"])
@role_required("INSTRUCTOR")
def add_course():
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())

        course = CourseService.add_course(data, user_id)

        return jsonify({
            "message": "Tạo khóa học thành công",
            "data": course.to_dict()
        }), 201

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("/<int:id>", methods=["PUT"])
@role_required("INSTRUCTOR")
def update_course(id):
    try:
        data = request.get_json()
        user_id = int(get_jwt_identity())

        course = CourseService.update_course(data, user_id, id)

        return jsonify({
            "message": "Cập nhật khóa học thành công",
            "data": course.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400


@course_bp.route("/<int:id>", methods=["DELETE"])
@role_required("INSTRUCTOR")
def delete_course(id):
    try:
        user_id = int(get_jwt_identity())

        CourseService.delete_course(user_id, id)

        return jsonify({"message": "Đã xóa khóa học"}), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400