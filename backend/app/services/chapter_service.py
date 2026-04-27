from app.configs.database_config import db
from app.models.chapter import Chapter
from app.models.course import Course


def get_chapters_by_course(course_id):
    return Chapter.query.filter_by(
        course_id=course_id,
        active=True
    ).order_by(Chapter.order_index).all()


def check_instructor_owns_course(user_id, course_id):
    course = Course.query.get(course_id)

    if not course:
        raise Exception("Khóa học không tồn tại")

    if course.instructor_id != user_id:
        raise Exception("Bạn không có quyền chỉnh sửa khóa học này")

    return course


def add_chapter(data, user_id, course_id):
    check_instructor_owns_course(user_id, course_id)

    title = data.get("title", "").strip()
    order_index = data.get("order_index", 1)

    if not title:
        raise Exception("Tên chương không được để trống")

    try:
        order_index = int(order_index)
    except:
        raise Exception("Thứ tự chương phải là số")

    chapter = Chapter(
        title=title,
        order_index=order_index,
        course_id=course_id
    )

    db.session.add(chapter)
    db.session.commit()

    return chapter


def update_chapter(data, user_id, chapter_id):
    chapter = Chapter.query.get(chapter_id)

    if not chapter:
        raise Exception("Chương không tồn tại")

    check_instructor_owns_course(user_id, chapter.course_id)

    if "title" in data:
        title = data.get("title", "").strip()
        if not title:
            raise Exception("Tên chương không được để trống")
        chapter.title = title

    if "order_index" in data:
        chapter.order_index = data.get("order_index")

    db.session.commit()

    return chapter


def delete_chapter(user_id, chapter_id):
    chapter = Chapter.query.get(chapter_id)

    if not chapter:
        raise Exception("Chương không tồn tại")

    check_instructor_owns_course(user_id, chapter.course_id)

    chapter.active = False
    db.session.commit()

    return chapter