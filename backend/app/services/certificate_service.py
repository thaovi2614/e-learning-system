import uuid
from app.configs.database_config import db
from app.models.user import User
from app.models.course import Course
from app.models.certificate import Certificate

def create_certificate_if_not_exists(user_id, course_id):
    existed = Certificate.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    if existed:
        return existed

    certificate = Certificate(
        user_id=user_id,
        course_id=course_id,
        certificate_code="CERT-" + str(uuid.uuid4())[:8].upper()
    )

    db.session.add(certificate)
    db.session.commit()

    return certificate
def get_certificate_by_course(user_id, course_id):
    certificate = Certificate.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    if not certificate:
        return None

    user = User.query.get(user_id)
    course = Course.query.get(course_id)

    data = certificate.to_dict()
    data["full_name"] = user.fullname if user else ""
    data["course_name"] = course.name if course else ""

    return data
