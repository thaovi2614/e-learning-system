import os
from werkzeug.utils import secure_filename

from app.configs.database_config import db
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.video_lesson import VideoLesson
from app.models.slide_lesson import SlideLesson
from app.enums.lesson_type import LessonType
from app.models.quiz import Quiz

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

ALLOWED_EXTENSIONS = {
    "SLIDE": {"pdf", "ppt", "pptx", "doc", "docx", "txt", "png", "jpg", "jpeg"},
    "VIDEO": {"mp4", "mov", "avi", "mkv", "webm"},
    "QUIZ": {"pdf", "doc", "docx", "txt", "png", "jpg", "jpeg"}
}


def check_instructor_owns_chapter(user_id, chapter_id):
    chapter = Chapter.query.get(chapter_id)

    if not chapter:
        raise Exception("Chương không tồn tại")

    course = Course.query.get(chapter.course_id)

    if not course:
        raise Exception("Khóa học không tồn tại")

    if course.instructor_id != user_id:
        raise Exception("Bạn không có quyền chỉnh sửa nội dung khóa học này")

    return chapter


# def save_upload_file(file, lesson_type):
#     if not file:
#         return None

#     filename = secure_filename(file.filename)

#     if "." not in filename:
#         raise Exception("File không hợp lệ")

#     ext = filename.rsplit(".", 1)[1].lower()

#     if ext not in ALLOWED_EXTENSIONS.get(lesson_type, set()):
#         raise Exception(f"File không hợp lệ cho loại {lesson_type}")

#     os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#     file_path = os.path.join(UPLOAD_FOLDER, filename)
#     file.save(file_path)

#     return file_path.replace("\\", "/")

def save_upload_file(file, lesson_type):
    if not file:
        return None

    filename = secure_filename(file.filename)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    return f"uploads/{filename}"


def get_lessons_by_chapter(chapter_id):
    return Lesson.query.filter_by(
        chapter_id=chapter_id,
        active=True
    ).order_by(Lesson.order_index).all()


def add_lesson(data, file, user_id, chapter_id):
    check_instructor_owns_chapter(user_id, chapter_id)

    title = data.get("title", "").strip()
    type_str = data.get("type")
    order_index = data.get("order_index", 1)

    if not title:
        raise Exception("Tên bài học không được để trống")

    if not type_str:
        raise Exception("Loại bài học không được để trống")

    try:
        order_index = int(order_index)
    except:
        raise Exception("Thứ tự phải là số")

    try:
        lesson_type = LessonType[type_str]
    except KeyError:
        raise Exception("Loại bài học không hợp lệ")

    if lesson_type.name == "VIDEO":
        video_url = data.get("videoUrl", "").strip()

        if file:
            video_url = save_upload_file(file, "VIDEO")

        if not video_url:
            raise Exception("Video phải có link hoặc file upload")

        lesson = VideoLesson(
            title=title,
            type=lesson_type,
            order_index=order_index,
            chapter_id=chapter_id,
            videoUrl=video_url
        )

    elif lesson_type.name == "SLIDE":
        slide_file = data.get("slideFile", "").strip()

        if file:
            slide_file = save_upload_file(file, "SLIDE")

        if not slide_file:
            raise Exception("Slide phải có link hoặc file upload")

        lesson = SlideLesson(
            title=title,
            type=lesson_type,
            order_index=order_index,
            chapter_id=chapter_id,
            slideFile=slide_file
        )
    elif lesson_type.name == "QUIZ":
        quiz_file = data.get("quizFile", "").strip()

        if file:
            quiz_file = save_upload_file(file, "QUIZ")

        if not quiz_file:
            raise Exception("Bài tập phải có link hoặc file upload")

        lesson = Lesson(
            title=title,
            type=lesson_type,
            order_index=order_index,
            chapter_id=chapter_id
        )

        db.session.add(lesson)
        db.session.flush()

        quiz = Quiz(
            lesson_id=lesson.id,
            timeLimit=0,
            passScore=0,
            quizFile=quiz_file
        )

        db.session.add(quiz)
        db.session.commit()

        return lesson

    else:
        lesson = Lesson(
            title=title,
            type=lesson_type,
            order_index=order_index,
            chapter_id=chapter_id
        )

    db.session.add(lesson)
    db.session.commit()

    return lesson


def update_lesson(data, file, user_id, lesson_id):
    lesson = Lesson.query.get(lesson_id)

    if not lesson:
        raise Exception("Bài học không tồn tại")

    check_instructor_owns_chapter(user_id, lesson.chapter_id)

    if "title" in data:
        title = data.get("title", "").strip()
        if not title:
            raise Exception("Tên bài học không được để trống")
        lesson.title = title

    if "order_index" in data:
        try:
            lesson.order_index = int(data.get("order_index"))
        except:
            raise Exception("Thứ tự phải là số")

    if isinstance(lesson, VideoLesson):
        if file:
            lesson.videoUrl = save_upload_file(file, "VIDEO")
        elif data.get("videoUrl"):
            lesson.videoUrl = data.get("videoUrl").strip()

    if isinstance(lesson, SlideLesson):
        if file:
            lesson.slideFile = save_upload_file(file, "SLIDE")
        elif data.get("slideFile"):
            lesson.slideFile = data.get("slideFile").strip()
    
    if lesson.type.name == "QUIZ":
        quiz = lesson.quiz

        if not quiz:
            quiz = Quiz(
                lesson_id=lesson.id,
                timeLimit=0,
                passScore=0
            )
            db.session.add(quiz)

        if file:
            quiz.quizFile = save_upload_file(file, "QUIZ")
        elif data.get("quizFile"):
            quiz.quizFile = data.get("quizFile").strip()

    db.session.commit()

    return lesson


def delete_lesson(user_id, lesson_id):
    lesson = Lesson.query.get(lesson_id)

    if not lesson:
        raise Exception("Bài học không tồn tại")

    check_instructor_owns_chapter(user_id, lesson.chapter_id)

    lesson.active = False
    db.session.commit()

    return lesson