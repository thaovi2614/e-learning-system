from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.course import Course
from app.configs.database_config import db

def find_enrollment_by_id(id):
    enrollment = Enrollment.query.get(id)
    if not enrollment:
        raise Exception("Đăng ký không tồn tại")
    return enrollment

def find_enrollment_by_user_id(user_id):
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()

    result = []
    for e in enrollments:
        result.append({
            "id": e.id,
            "user_id": e.user_id,
            "course_id": e.course_id,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    
    return result

def find_enrollment_by_user_and_course(user_id, course_id):
    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    return enrollment

def add_enrollment(user_id, courses):
    if not courses:
        return []

    course_ids = [c.id for c in courses]

    existed = Enrollment.query.filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id.in_(course_ids)
    ).all()

    existed_ids = {e.course_id for e in existed}

    enrollments = [
        Enrollment(user_id=user_id, course_id=c.id)
        for c in courses
        if c.id not in existed_ids
    ]

    try:
        db.session.add_all(enrollments)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return enrollments

def add_single_enrollment(user_id, course_id):
    course = Course.query.get(course_id)
    if not course:
        raise ValueError("Khóa học không tồn tại")

    existed = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    if existed:
        raise ValueError("Bạn đã đăng ký khóa học này rồi")

    enrollment = Enrollment(user_id=user_id, course_id=course_id)

    try:
        db.session.add(enrollment)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return enrollment