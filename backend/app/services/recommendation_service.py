from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.services.ai_recommendation_service import ai_pick_top_courses


CAREER_GOAL_KEYWORDS = {
    "backend": ["spring", "api", "backend", "sql", "python"],
    "frontend": ["react", "javascript", "html", "css", "frontend"],
    "data_analyst": ["sql", "data", "python", "analyst"],
    "ai": ["ai", "python", "machine learning"],
    "mobile": ["flutter", "android", "mobile"],
    "marketing": ["seo", "digital marketing", "facebook", "tiktok"],
    "business": ["khởi nghiệp", "startup", "kinh doanh", "business"],
    "hr": ["nhân sự", "hr", "quản lý nhân sự", "đội nhóm"],
    "language": ["tiếng anh", "tiếng nhật", "n5", "giao tiếp","tiếng"],
    "soft_skill": ["kỹ năng", "thời gian", "năng suất"],
}


def get_course_text(course):
    return f"{course.name or ''} {course.subtitle or ''} {course.description or ''}".lower()


def is_match_goal(course, learning_goal):
    if not learning_goal:
        return False

    goal = learning_goal.lower()
    course_text = get_course_text(course)

    keywords = CAREER_GOAL_KEYWORDS.get(goal, [])

    return any(keyword in course_text for keyword in keywords)


def get_level_by_count(count):
    if count >= 6:
        return "advanced"

    if count >= 3:
        return "intermediate"

    return "beginner"


def get_user_level_by_goal(user_id, goal):
    """
    Fake level theo từng lĩnh vực.
    Ví dụ:
    - user học nhiều khóa backend -> backend advanced
    - user chưa học marketing -> marketing beginner
    """
    if not user_id or not goal:
        return "beginner"

    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    enrolled_ids = [e.course_id for e in enrollments]

    if not enrolled_ids:
        return "beginner"

    learned_courses = Course.query.filter(Course.id.in_(enrolled_ids)).all()

    matched_count = 0

    for course in learned_courses:
        if is_match_goal(course, goal):
            matched_count += 1

    return get_level_by_count(matched_count)


def build_candidate_data(scored_courses):
    return [
        {
            "id": item["course"].id,
            "name": item["course"].name,
            "subtitle": item["course"].subtitle,
            "description": item["course"].description,
            "level": item["course"].level,
            "type": item["course"].type.name,
            "category_id": item["course"].category_id,
            "score": item["score"],
            "rule_reasons": item["rule_reasons"],
        }
        for item in scored_courses
    ]


def build_fallback_reason(course, rule_reasons):
    name = (course.name or "").lower()

    if "spring" in name or "api" in name or "backend" in name:
        return (
            "Khóa học này giúp bạn xây dựng nền tảng backend thực tế, "
            "biết cách thiết kế API và xử lý dữ liệu cho ứng dụng web."
        )

    if "sql" in name or "data" in name:
        return (
            "Khóa học này giúp bạn phát triển kỹ năng xử lý và phân tích dữ liệu, "
            "phù hợp cho định hướng Data Analyst hoặc Backend."
        )

    if "python" in name:
        return (
            "Khóa học này giúp bạn xây dựng nền tảng Python vững chắc "
            "để học tiếp AI, backend hoặc xử lý dữ liệu."
        )

    if "react" in name or "javascript" in name:
        return (
            "Khóa học này giúp bạn xây dựng giao diện web hiện đại "
            "và hiểu cách phát triển frontend thực tế."
        )

    if "flutter" in name or "android" in name:
        return (
            "Khóa học này giúp bạn làm quen với phát triển ứng dụng mobile "
            "và xây dựng app thực tế trên thiết bị di động."
        )

    if "seo" in name or "marketing" in name:
        return (
            "Khóa học này giúp bạn hiểu cách triển khai digital marketing "
            "và tối ưu hiệu quả tiếp cận khách hàng."
        )

    return (
        "Khóa học này giúp bạn mở rộng kỹ năng "
        "và phát triển theo đúng lộ trình học tập hiện tại."
    )


def map_ai_result(ai_recs, top_candidates):
    course_map = {item["course"].id: item for item in top_candidates}
    final_result = []

    for rec in ai_recs:
        course_id = rec.get("course_id")
        item = course_map.get(course_id)

        if item:
            course_data = item["course"].to_dict()
            course_data["score"] = item["score"]
            course_data["rule_reasons"] = item["rule_reasons"]
            course_data["ai_reason"] = rec.get(
                "reason",
                build_fallback_reason(item["course"], item["rule_reasons"])
            )
            final_result.append(course_data)

    if not final_result:
        final_result = [
            {
                **item["course"].to_dict(),
                "score": item["score"],
                "rule_reasons": item["rule_reasons"],
                "ai_reason": build_fallback_reason(
                    item["course"],
                    item["rule_reasons"]
                ),
            }
            for item in top_candidates[:5]
        ]

    return final_result


def get_available_courses(user_id=None):
    """
    Nếu có user_id: loại bỏ khóa user đã đăng ký.
    Nếu guest: lấy toàn bộ khóa active.
    """
    if not user_id:
        courses = Course.query.filter(Course.active == True).all()
        return courses, []

    enrollments = Enrollment.query.filter_by(user_id=user_id).all()
    enrolled_ids = [e.course_id for e in enrollments]

    if enrolled_ids:
        courses = Course.query.filter(
            Course.active == True,
            ~Course.id.in_(enrolled_ids)
        ).all()
    else:
        courses = Course.query.filter(Course.active == True).all()

    return courses, enrolled_ids


def get_career_recommendations(user, courses):
    scored_courses = []

    for course in courses:
        score = 0
        reasons = []

        if is_match_goal(course, user.learning_goal):
            score += 5
            reasons.append("Phù hợp mục tiêu nghề nghiệp")

        if user.level and course.level:
            if user.level.lower() == course.level.lower():
                score += 2
                reasons.append("Phù hợp trình độ trong lĩnh vực này")

        count = Enrollment.query.filter_by(course_id=course.id).count()
        if count >= 2:
            score += 1
            reasons.append("Khóa học phổ biến")

        if score > 0:
            scored_courses.append({
                "course": course,
                "score": score,
                "rule_reasons": reasons,
            })

    scored_courses.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = scored_courses[:10]

    candidate_data = build_candidate_data(top_candidates)
    ai_recs = ai_pick_top_courses(user, candidate_data)

    return map_ai_result(ai_recs, top_candidates)[:3]


# def get_history_recommendations(user, courses, enrolled_ids):
#     """
#     History recommendation chỉ dùng rule-based để tránh tốn quota Gemini.
#     """
#     if not enrolled_ids:
#         return []

#     learned_courses = Course.query.filter(Course.id.in_(enrolled_ids)).all()

#     learned_category_ids = [c.category_id for c in learned_courses]

#     learned_keywords = []
#     for c in learned_courses:
#         learned_keywords.extend(get_course_text(c).split())

#     scored_courses = []

#     for course in courses:
#         score = 0
#         reasons = []
#         course_text = get_course_text(course)

#         if course.category_id in learned_category_ids:
#             score += 4
#             reasons.append("Liên quan đến danh mục khóa đã học")

#         matched_keywords = [
#             keyword for keyword in learned_keywords
#             if len(keyword) > 3 and keyword in course_text
#         ]

#         if matched_keywords:
#             score += 2
#             reasons.append("Có nội dung liên quan khóa đã học")

#         if user.level and course.level:
#             if user.level.lower() == course.level.lower():
#                 score += 1
#                 reasons.append("Phù hợp trình độ hiện tại")

#         if score > 0:
#             scored_courses.append({
#                 "course": course,
#                 "score": score,
#                 "rule_reasons": reasons,
#             })

#     scored_courses.sort(key=lambda x: x["score"], reverse=True)

#     history_recommendations = [
#         {
#             **item["course"].to_dict(),
#             "score": item["score"],
#             "rule_reasons": item["rule_reasons"],
#             "ai_reason": (
#                 "Khóa học này liên quan đến những nội dung bạn đã học trước đó "
#                 "và giúp bạn mở rộng kỹ năng theo lộ trình hiện tại."
#             ),
#         }
#         for item in scored_courses[:3]
#     ]

#     return history_recommendations

def get_history_recommendations(user, courses, enrolled_ids): # Thêm AI cho History 
    if not enrolled_ids:
        return []

    learned_courses = Course.query.filter(Course.id.in_(enrolled_ids)).all()
    learned_category_ids = [c.category_id for c in learned_courses]

    learned_keywords = []
    for c in learned_courses:
        learned_keywords.extend(get_course_text(c).split())

    scored_courses = []

    for course in courses:
        score = 0
        reasons = []
        course_text = get_course_text(course)

        if course.category_id in learned_category_ids:
            score += 4
            reasons.append("Liên quan đến danh mục khóa đã học")

        matched_keywords = [
            keyword for keyword in learned_keywords
            if len(keyword) > 3 and keyword in course_text
        ]
        if matched_keywords:
            score += 2
            reasons.append("Có nội dung liên quan khóa đã học")

        if user.level and course.level:
            if user.level.lower() == course.level.lower():
                score += 1
                reasons.append("Phù hợp trình độ hiện tại")

        if score > 0:
            scored_courses.append({
                "course": course,
                "score": score,
                "rule_reasons": reasons,
            })

    scored_courses.sort(key=lambda x: x["score"], reverse=True)

    # ✅ Thêm AI vào đây — giống career
    top_candidates = scored_courses[:10]
    candidate_data = build_candidate_data(top_candidates)
    ai_recs = ai_pick_top_courses(user, candidate_data)
    return map_ai_result(ai_recs, top_candidates)[:3]

def get_roadmap_recommendations(user_id):
    enrollments = Enrollment.query.filter_by(user_id=user_id).all()

    if not enrollments:
        return []

    enrolled_ids = [e.course_id for e in enrollments]

    learned_courses = Course.query.filter(
        Course.id.in_(enrolled_ids)
    ).all()

    roadmap_results = []

    for learned in learned_courses:

        if not learned.roadmap or not learned.roadmap_order:
            continue

        next_course = Course.query.filter(
            Course.roadmap == learned.roadmap,
            Course.roadmap_order == learned.roadmap_order + 1,
            Course.active == True
        ).first()

        if next_course:

            existed = any(
                c["id"] == next_course.id
                for c in roadmap_results
            )

            if not existed:

                data = next_course.to_dict()

                data["roadmap_reason"] = (
                    f"Khóa học tiếp theo trong lộ trình "
                    f"{learned.roadmap.upper()}"
                )

                roadmap_results.append(data)

    return roadmap_results[:3]

def recommend_courses(user_id=None, goal=None):
    """
    Nếu chưa đăng nhập:
    - chỉ gợi ý theo mục tiêu nghề nghiệp
    - level theo goal mặc định là beginner

    Nếu đã đăng nhập:
    - gợi ý theo mục tiêu nghề nghiệp
    - level được tính riêng theo goal
    - gợi ý theo lịch sử học
    """
    selected_goal = goal or "backend"

    if not user_id:
        courses, _ = get_available_courses()

        class GuestUser:
            level = "beginner"
            learning_goal = selected_goal

        guest_user = GuestUser()

        career_recommendations = get_career_recommendations(
            guest_user,
            courses
        )

        return {
            "career_recommendations": career_recommendations,
            "history_recommendations": [],
        }

    user = User.query.get(user_id)

    if not user:
        return {
            "career_recommendations": [],
            "history_recommendations": [],
        }

    user.learning_goal = selected_goal

    # Level được tính theo từng mục tiêu/lĩnh vực
    user.level = get_user_level_by_goal(user_id, selected_goal)

    courses, enrolled_ids = get_available_courses(user_id)

    career_recommendations = get_career_recommendations(
        user,
        courses
    )

    history_recommendations = get_history_recommendations(
        user,
        courses,
        enrolled_ids
    )
    roadmap_recommendations = get_roadmap_recommendations(user_id)

    return {
        "current_level": user.level,
        "current_goal": selected_goal,
        "career_recommendations": career_recommendations,
        "history_recommendations": history_recommendations,
        "roadmap_recommendations": roadmap_recommendations,
    }