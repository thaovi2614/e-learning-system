import os
import csv
import io
import chardet
from sqlalchemy.sql import func
from app.configs.database_config import db
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.enrollment import Enrollment
from app.models.video_lesson import VideoLesson
from app.models.slide_lesson import SlideLesson
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.enums.lesson_type import LessonType
from app.enums.answer_quiz import AnswerQuize
import app.services.cloudinary_service as CloudinaryService


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

    try:
        # ================= VIDEO =================
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

        # ================= SLIDE =================
        elif lesson_type.name == "SLIDE":
            slide_file = ""

            if file:
                upload_result = CloudinaryService.upload_pdf(file, user_id)
                if not upload_result:
                    raise Exception("Upload PDF thất bại")

                slide_file = upload_result.get("secure_url")

            if not slide_file:
                raise Exception("Slide phải có file")

            lesson = SlideLesson(
                title=title,
                type=lesson_type,
                order_index=order_index,
                chapter_id=chapter_id,
                slideFile=slide_file
            )

        # ================= QUIZ =================
        elif lesson_type.name == "QUIZ":
            if not file:
                raise Exception("Quiz phải upload file CSV")

            lesson = Lesson(
                title=title,
                type=lesson_type,
                order_index=order_index,
                chapter_id=chapter_id
            )

            db.session.add(lesson)
            db.session.flush()

            timeLimit = data.get("timeLimit", 0)
            passScore = data.get("passScore", 0)

            quiz = Quiz(
                lesson_id=lesson.id,
                timeLimit=timeLimit,
                passScore=passScore
            )
            db.session.add(quiz)
            db.session.flush()

            file.stream.seek(0)
            content = file.stream.read()
            encoding = chardet.detect(content)["encoding"]

            text = content.decode(encoding or "utf-8", errors="ignore")
            stream = io.StringIO(text)
            reader = csv.DictReader(stream)

            required_fields = ["question", "optionA", "optionB", "optionC", "optionD", "correct"]

            if not reader.fieldnames or not all(f in reader.fieldnames for f in required_fields):
                raise Exception("CSV thiếu cột bắt buộc")

            questions = []

            for row in reader:
                correct = row["correct"].strip().upper()

                if correct not in ["A", "B", "C", "D"]:
                    raise Exception("Đáp án phải là A/B/C/D")

                question = QuizQuestion(
                    question_text=row["question"].strip(),
                    optionA=row["optionA"].strip(),
                    optionB=row["optionB"].strip(),
                    optionC=row["optionC"].strip(),
                    optionD=row["optionD"].strip(),
                    correct_answer=AnswerQuize[correct],
                    quiz_id=quiz.id
                )

                questions.append(question)

            db.session.add_all(questions)

            db.session.commit()
            return lesson

        # ================= DEFAULT =================
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

    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))

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
    # elif lesson.type.name == "QUIZ":
    #     quiz = lesson.quiz

    #     if not quiz:
    #         quiz = Quiz(
    #             lesson_id=lesson.id,
    #             timeLimit=0,
    #             passScore=0
    #         )
    #         db.session.add(quiz)

    #     if file:
    #         upload_result = CloudinaryService.upload_pdf(file, user_id)
    #         if not upload_result:
    #             raise Exception("Upload file quiz thất bại")

    #         quiz.quizFile = upload_result.get("secure_url")

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