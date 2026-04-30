import os
from werkzeug.utils import secure_filename

from sqlalchemy.sql import func
from app.configs.database_config import db
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.video_lesson import VideoLesson
from app.models.slide_lesson import SlideLesson
from app.enums.lesson_type import LessonType
from app.models.quiz import Quiz
import app.services.cloudinary_service as CloudinaryService

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

def can_access_lesson(user_id, lesson):
    # lấy course_id từ lesson
    course_id = lesson.chapter.course_id

    enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()

    return enrollment is not None

def find_lesson_by_id(id):
    lesson = db.session.get(Lesson, id)
    if not lesson:
        raise Exception("Bài học không tồn tại")
    return lesson


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

    if not title:
        raise Exception("Tên bài học không được để trống")

    if not type_str:
        raise Exception("Loại bài học không được để trống")

    try:
        lesson_type = LessonType[type_str]
    except KeyError:
        raise Exception("Loại bài học không hợp lệ")

    max_index = (
        db.session.query(func.max(Lesson.order_index))
        .filter_by(chapter_id=chapter_id, active=True)
        .scalar()
    ) or 0

    order_index = max_index + 1

    if lesson_type.name == "VIDEO":
        video_url = ""

        if file:
            upload_result = CloudinaryService.upload_video(file, user_id)
            if not upload_result:
                raise Exception("Upload video thất bại")

            video_url = upload_result.get("original_url") or upload_result.get("stream_url")
        
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
        slide_file = ""

        if file:
            upload_result = CloudinaryService.upload_pdf(file, user_id)
            if not upload_result:
                raise Exception("Upload PDF thất bại")

            slide_file = upload_result.get("secure_url")

        if not slide_file:
            raise Exception("Slide phải có file hoặc link")

        lesson = SlideLesson(
            title=title,
            type=lesson_type,
            order_index=order_index,
            chapter_id=chapter_id,
            slideFile=slide_file
        )

    elif lesson_type.name == "QUIZ":
        quiz_file = ""

        if file:
            upload_result = CloudinaryService.upload_pdf(file, user_id)
            if not upload_result:
                raise Exception("Upload file quiz thất bại")

            quiz_file = upload_result.get("secure_url")

        if not quiz_file:
            raise Exception("Quiz phải có file")

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

    title = data.get("title", "").strip()
    if title:
        lesson.title = title

    # ================= VIDEO =================
    if isinstance(lesson, VideoLesson):
        if file:
            upload_result = CloudinaryService.upload_video(file, user_id)
            if not upload_result:
                raise Exception("Upload video thất bại")

            lesson.videoUrl = (
                upload_result.get("original_url")
                or upload_result.get("secure_url")
            )

    # ================= SLIDE =================
    elif isinstance(lesson, SlideLesson):
        if file:
            upload_result = CloudinaryService.upload_pdf(file, user_id)
            if not upload_result:
                raise Exception("Upload PDF thất bại")

            lesson.slideFile = upload_result.get("secure_url")

    # ================= QUIZ =================
    elif lesson.type.name == "QUIZ":
        quiz = lesson.quiz

        if not quiz:
            quiz = Quiz(
                lesson_id=lesson.id,
                timeLimit=0,
                passScore=0
            )
            db.session.add(quiz)

        if file:
            upload_result = CloudinaryService.upload_pdf(file, user_id)
            if not upload_result:
                raise Exception("Upload file quiz thất bại")

            quiz.quizFile = upload_result.get("secure_url")

    db.session.commit()

    return lesson


def delete_lesson(user_id, lesson_id):
    lesson = Lesson.query.get(lesson_id)

    if not lesson:
        raise Exception("Bài học không tồn tại")

    check_instructor_owns_chapter(user_id, lesson.chapter_id)

    chapter_id = lesson.chapter_id
    deleted_index = lesson.order_index

    lesson.active = False

    lessons_to_update = (
        Lesson.query
        .filter(
            Lesson.chapter_id == chapter_id,
            Lesson.active == True,
            Lesson.order_index > deleted_index
        )
        .all()
    )

    for l in lessons_to_update:
        l.order_index -= 1

    db.session.commit()

    return lesson