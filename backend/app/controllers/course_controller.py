import traceback
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required
from app.middlewares.jwt_middleware import role_required
import app.services.course_service as CourseService
from app.configs.database_config import db
from app.models.question import Question 
from app.models.user import User
from app.models.answer import Answer
from datetime import datetime
from werkzeug.utils import secure_filename
from app.services.user_service import UserService


import cloudinary.uploader
import app.services.recommendation_service as RecommendationService


course_bp = Blueprint("course", __name__, url_prefix="/api/courses")

# --- PHẦN QUẢN LÝ KHÓA HỌC (COURSE) ---

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

@course_bp.route("/by-category/<int:category_id>")
def get_courses_by_category_api(category_id):
    try:
        exclude_id = request.args.get("exclude_id", type=int)

        data = CourseService.get_courses_by_category(category_id, exclude_id)

        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

@course_bp.route("", methods=["GET"])
def get_courses():
    try:
        data = request.args.to_dict()
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            user = UserService.get_user_profile(int(user_id)) if user_id else None
        except Exception as jwt_err:
            print("Lỗi JWT (Có thể bỏ qua nếu là khách):", jwt_err)
            user = None
            
        is_admin = user and getattr(user, 'role', None) and user.role.name == "ADMIN"
        
        result = CourseService.find_courses(data, is_admin)
        
        return jsonify({
            "items": [c.to_dict() for c in result["items"]],
            "page": result["page"], "size": result["size"],
            "total": result["total"], "total_pages": result["total_pages"]
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc() # Dòng này sẽ in chi tiết lỗi ra Terminal của Flask
        return jsonify({"message": f"Chi tiết lỗi Backend: {str(e)}"}), 400

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

# --- PHẦN DIỄN ĐÀN (FORUM) ---

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
                "student_id": q.student_id, "file_url": getattr(q, 'file_url', None),
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
            upload_result = cloudinary.uploader.upload(file, folder="forum/questions")
            file_url = upload_result['secure_url'] 
            
        new_q = Question(
            content=content, student_id=user_id, course_id=course_id,
            file_url=file_url, sentAt=datetime.now()
        )
        db.session.add(new_q)
        db.session.commit()
        return jsonify({"message": "Đăng thành công", "file_url": file_url}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>', methods=['GET'])
def get_question_detail(q_id):
    try:
        res = db.session.query(Question, User).join(User, Question.student_id == User.id).filter(Question.id == q_id).first()
        if not res: return jsonify({"message": "Không thấy câu hỏi"}), 404
        q, user_q = res
        
        answers_data = db.session.query(Answer, User).join(User, Answer.user_id == User.id).filter(Answer.question_id == q_id).all()
        
        return jsonify({
            "question": {
                "id": q.id, "content": q.content, "username": user_q.username, 
                "file_url": getattr(q, 'file_url', None), 
                "role": user_q.role.name if getattr(user_q, 'role', None) else "STUDENT", 
                "sentAt": q.sentAt.strftime("%H:%M %d/%m/%Y")
            },
            "answers": [{
                "id": a.id, "content": a.content, "username": u.username, 
                "user_id": a.user_id, "parent_id": getattr(a, 'parent_id', None),
                "file_url": getattr(a, 'file_url', None),
                "is_correct": getattr(a, 'is_correct', False),
                "role": u.role.name if getattr(u, 'role', None) else "STUDENT",
                "sentAt": a.sentAt.strftime("%H:%M %d/%m/%Y")
            } for a, u in answers_data]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>/answers', methods=['POST'])
@jwt_required()
def post_answer(q_id):
    try:
        user_id = int(get_jwt_identity())
        content = request.form.get('content')
        parent_id = request.form.get('parent_id')
        file = request.files.get('file')
        
        if not content:
            return jsonify({"message": "Thiếu nội dung trả lời"}), 422
            
        file_url = None
        if file:
            upload_result = cloudinary.uploader.upload(file, folder="forum/answers")
            file_url = upload_result['secure_url']
            
        new_ans = Answer(
            content=content, user_id=user_id, question_id=q_id,
            parent_id=parent_id if parent_id and parent_id != 'null' else None,
            file_url=file_url, sentAt=datetime.now()
        )
        db.session.add(new_ans)
        db.session.commit()
        return jsonify({"message": "Đã gửi phản hồi thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@course_bp.route('/questions/<int:q_id>', methods=['DELETE'])
@jwt_required()
def delete_question(q_id):
    try:
        user_id = int(get_jwt_identity())
        question = db.session.query(Question).filter(Question.id == q_id).first()
        if not question:
            return jsonify({"message": "Không tìm thấy câu hỏi"}), 404
        if question.student_id != user_id:
            return jsonify({"message": "Bạn không có quyền xóa câu hỏi này"}), 403
        # Xóa cmt con hết
        db.session.query(Answer).filter(Answer.question_id == q_id).delete()

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
        question = db.session.query(Question).filter(Question.id == q_id).first()
        if not question:
            return jsonify({"message": "Không tìm thấy câu hỏi"}), 404
        if question.student_id != user_id:
            return jsonify({"message": "Bạn không có quyền sửa câu hỏi này"}), 403
            
        content = request.form.get('content')
        file = request.files.get('file')
        
        if content:
            question.content = content
        if file:
            upload_result = cloudinary.uploader.upload(file, folder="forum/questions")
            question.file_url = upload_result['secure_url']
            
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
            upload_result = cloudinary.uploader.upload(file, folder="forum/answers")
            ans.file_url = upload_result['secure_url']
            
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


@course_bp.route('/answers/<int:ans_id>/correct', methods=['PUT'])
@jwt_required()
@role_required("INSTRUCTOR")
def mark_correct_answer(ans_id):
    try:
        ans = db.session.query(Answer).filter(Answer.id == ans_id).first()
        if not ans: return jsonify({"message": "Không tìm thấy phản hồi"}), 404
        
        ans.is_correct = not getattr(ans, 'is_correct', False)
        db.session.commit()
        
        return jsonify({"message": "Đã lưu thay đổi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

# @course_bp.route("/recommend", methods=["GET"])
# @jwt_required(optional=True)
# def recommend():
#     user_id = get_jwt_identity()
#     goal = request.args.get("goal")

#     data = RecommendationService.recommend_courses(user_id, goal)

#     return jsonify(data), 200
@course_bp.route("/recommend", methods=["GET"])
@jwt_required(optional=True)
def recommend():
    user_id = get_jwt_identity()
    if user_id:
        user_id = int(user_id)  # ✅ convert sang int
    goal = request.args.get("goal")
    data = RecommendationService.recommend_courses(user_id, goal)
    return jsonify(data), 200

