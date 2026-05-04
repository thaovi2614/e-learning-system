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

import traceback
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
from app.middlewares.jwt_middleware import role_required
import app.services.course_service as CourseService
import app.services.user_service as UserService
from app.configs.database_config import db
from app.models.question import Question 
from app.models.user import User
from app.models.answer import Answer
from datetime import datetime
from werkzeug.utils import secure_filename

course_bp = Blueprint("course", __name__, url_prefix="/api/courses")

UPLOAD_FORUM_FOLDER = 'app/static/uploads/forum'
if not os.path.exists(UPLOAD_FORUM_FOLDER):
    os.makedirs(UPLOAD_FORUM_FOLDER)


@course_bp.route("/manage", methods=["GET"])
@role_required("INSTRUCTOR")
def get_manage_courses():
    try:
        user_id = int(get_jwt_identity())
        courses = CourseService.find_instructor_manage_courses(user_id)
        return jsonify({
            "items": [c.to_dict() for c in courses],
            "page": 1, "size": len(courses), "total": len(courses), "total_pages": 1
        }), 200
    except Exception as e:
        return jsonify({"message": str(e), "trace": traceback.format_exc()}), 500

@course_bp.route("/my-courses", methods=["GET"])
@jwt_required()
def get_my_courses():
    try:
        data = request.args.to_dict()
        user_id = int(get_jwt_identity())
        result = CourseService.get_my_courses(data, user_id)
        return jsonify({
            "items": [c.to_dict() for c in result["items"]],
            "page": result["page"], "size": result["size"],
            "total": result["total"], "total_pages": result["total_pages"]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route("/<int:id>", methods=["GET"])
def get_by_id(id):
    try:
        course = CourseService.find_course_by_id(id)
        if not course: return jsonify({"message": "Khóa học không tồn tại"}), 404
        return jsonify(course.to_dict()), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route("", methods=["GET"])
def get_courses():
    try:
        data = request.args.to_dict()
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            user = UserService.find_user_by_id(int(user_id)) if user_id else None
        except:
            user = None
        is_admin = user and user.role.name == "ADMIN"
        result = CourseService.find_courses(data, is_admin)
        return jsonify({
            "items": [c.to_dict() for c in result["items"]],
            "page": result["page"], "size": result["size"],
            "total": result["total"], "total_pages": result["total_pages"]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route("", methods=["POST"])
@role_required("INSTRUCTOR")
def add_course():
    try:
        data = request.form.to_dict()
        file = request.files.get("thumbnail")
        user_id = int(get_jwt_identity())
        course = CourseService.add_course(data, file, user_id)
        return jsonify({"message": "Tạo khóa học thành công", "data": course.to_dict()}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route("/<int:id>", methods=["PUT"])
@role_required("INSTRUCTOR")
def update_course(id):
    try:
        data = request.form.to_dict()
        file = request.files.get("thumbnail")
        user_id = int(get_jwt_identity())

        course = CourseService.update_course(data, file, user_id, id)

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

# --- DIỄN ĐÀN (FORUM) ---

@course_bp.route('/<int:course_id>/questions', methods=['GET'])
def get_questions(course_id):
    try:
        questions = db.session.query(Question, User.username)\
            .join(User, Question.student_id == User.id)\
            .filter(Question.course_id == course_id)\
            .order_by(Question.sentAt.desc()).all()
        result = []
        for q, username in questions:
            result.append({
                "id": q.id, "content": q.content, "username": username,
                "student_id": q.student_id, "file_url": q.file_url,
                "sentAt": q.sentAt.strftime("%d/%m/%Y") if q.sentAt else "N/A"
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions', methods=['POST'])
@jwt_required()
def post_question():
    try:
        content = request.form.get('content')
        user_id = get_jwt_identity()
        course_id = request.form.get('course_id')
        file = request.files.get('file')
        file_url = None
        if file:
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            file.save(os.path.join(UPLOAD_FORUM_FOLDER, filename))
            file_url = f"static/uploads/forum/{filename}"
        new_q = Question(
            content=content, student_id=user_id, course_id=course_id,
            file_url=file_url, sentAt=datetime.now()
        )
        db.session.add(new_q)
        db.session.commit()
        return jsonify({"message": "Đăng thành công"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>', methods=['GET'])
def get_question_detail(q_id):
    try:
        res = db.session.query(Question, User.username).join(User, Question.student_id == User.id).filter(Question.id == q_id).first()
        if not res: return jsonify({"message": "Không thấy câu hỏi"}), 404
        q, username = res
        answers = db.session.query(Answer, User.username).join(User, Answer.user_id == User.id).filter(Answer.question_id == q_id).all()
        return jsonify({
            "question": {
                "id": q.id, "content": q.content, "username": username, 
                "file_url": q.file_url, "sentAt": q.sentAt.strftime("%H:%M %d/%m/%Y")
            },
            "answers": [{
                "id": a.id, "content": a.content, "username": uname, 
                "user_id": a.user_id,
                "file_url": getattr(a, 'file_url', None), # Thêm trường file_url cho câu trả lời
                "sentAt": a.sentAt.strftime("%H:%M %d/%m/%Y")
            } for a, uname in answers]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>/answers', methods=['POST'])
@jwt_required()
def post_answer(q_id):
    try:
        user_id = int(get_jwt_identity())
        content = request.form.get('content') # Lấy chữ từ form
        file = request.files.get('file')      # Lấy file từ form
        
        if not content:
            return jsonify({"message": "Thiếu nội dung trả lời"}), 422

        file_url = None
        if file:
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            file.save(os.path.join(UPLOAD_FORUM_FOLDER, filename))
            file_url = f"static/uploads/forum/{filename}"

        new_ans = Answer(
            content=content,
            user_id=user_id,
            question_id=q_id,
            file_url=file_url, # Lưu file_url vào DB
            sentAt=datetime.now()
        )
        db.session.add(new_ans)
        db.session.commit()
        return jsonify({"message": "Đã gửi câu trả lời thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>', methods=['DELETE'])
@jwt_required()
def delete_question(q_id):
    try:
        user_id = int(get_jwt_identity())
        
        # Tìm câu hỏi trong database
        question = db.session.query(Question).filter(Question.id == q_id).first()
        
        if not question:
            return jsonify({"message": "Không tìm thấy câu hỏi"}), 404
            
        # Kiểm tra xem người đang thao tác có phải là chủ bài đăng không
        if question.student_id != user_id:
            return jsonify({"message": "Bạn không có quyền xóa câu hỏi này"}), 403
            
        # Thực hiện xóa
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({"message": "Đã xóa câu hỏi thành công", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e), "success": False}), 400

@course_bp.route('/questions/<int:q_id>', methods=['PUT'])
@jwt_required()
def update_question(q_id):
    try:
        user_id = int(get_jwt_identity())
        
        # Tìm câu hỏi trong database
        question = db.session.query(Question).filter(Question.id == q_id).first()
        
        if not question:
            return jsonify({"message": "Không tìm thấy câu hỏi"}), 404
            
        # Kiểm tra quyền
        if question.student_id != user_id:
            return jsonify({"message": "Bạn không có quyền sửa câu hỏi này"}), 403
            
        # LẤY DỮ LIỆU TỪ FORM (Vì frontend sẽ gửi FormData chứa chữ và file)
        content = request.form.get('content')
        file = request.files.get('file')
        
        if content:
            question.content = content
            
        # Nếu người dùng chọn file mới để upload
        if file:
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            file.save(os.path.join(UPLOAD_FORUM_FOLDER, filename))
            question.file_url = f"static/uploads/forum/{filename}"
            
        db.session.commit()
        return jsonify({"message": "Cập nhật thành công", "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e), "success": False}), 400
    
@course_bp.route('/answers/<int:ans_id>', methods=['PUT'])
@jwt_required()
def update_answer(ans_id):
    try:
        user_id = int(get_jwt_identity())
        ans = db.session.query(Answer).filter(Answer.id == ans_id).first()
        
        if not ans: return jsonify({"message": "Không tìm thấy phản hồi"}), 404
        if ans.user_id != user_id: return jsonify({"message": "Không có quyền sửa"}), 403
            
        content = request.form.get('content')
        file = request.files.get('file')
        
        if content:
            ans.content = content
            
        if file:
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            file.save(os.path.join(UPLOAD_FORUM_FOLDER, filename))
            ans.file_url = f"static/uploads/forum/{filename}"
            
        db.session.commit()
        return jsonify({"message": "Đã cập nhật"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@course_bp.route('/answers/<int:ans_id>', methods=['DELETE'])
@jwt_required()
def delete_answer(ans_id):
    try:
        user_id = int(get_jwt_identity())
        ans = db.session.query(Answer).filter(Answer.id == ans_id).first()
        
        if not ans: return jsonify({"message": "Không tìm thấy phản hồi"}), 404
        if ans.user_id != user_id: return jsonify({"message": "Không có quyền xóa"}), 403
            
        db.session.delete(ans)
        db.session.commit()
        return jsonify({"message": "Đã xóa"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400