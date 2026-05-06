from app import create_app
from app.configs.database_config import db
from app.models.user import User
from app.models.course import Course

app = create_app()

with app.app_context():

    # ===== 1. UPDATE USER =====

    user = User.query.filter_by(username="vi").first()

    if user:

        # beginner / intermediate / advanced
        user.level = "beginner"

        # backend / frontend / ai / mobile / data_analyst / marketing
        user.learning_goal = "backend"

        print("Updated user:", user.username)

    else:
        print("Không tìm thấy user")


    # ===== 2. UPDATE COURSE LEVEL =====

    courses = Course.query.all()

    for course in courses:

        name = (course.name or "").lower()

        # BACKEND
        if "spring" in name or "api" in name:
            course.level = "beginner"

        # PYTHON / AI
        elif "python" in name:
            course.level = "beginner"

        elif "ai" in name:
            course.level = "advanced"

        # FRONTEND
        elif "react" in name:
            course.level = "intermediate"

        elif "javascript" in name:
            course.level = "beginner"

        # MOBILE
        elif "flutter" in name:
            course.level = "beginner"

        elif "android" in name:
            course.level = "intermediate"

        # DATA
        elif "sql" in name:
            course.level = "beginner"

        # MARKETING
        elif "seo" in name:
            course.level = "beginner"

        else:
            course.level = "beginner"

        print(f"{course.id} - {course.name} => {course.level}")

    # ===== 3. SAVE DB =====

    db.session.commit()

    print("DONE")