from sqlalchemy import func
from app.configs.database_config import db
from app.models.course import Course
from app.models.chapter import Chapter
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.enums.lesson_progress_status import LessonProgressStatus
from app.services.certificate_service import create_certificate_if_not_exists


def get_progress_detail(user_id, course_id):
    progresses = db.session.query(LessonProgress)\
    .join(Lesson, Lesson.id == LessonProgress.lesson_id)\
    .join(Chapter, Chapter.id == Lesson.chapter_id)\
    .filter(
        LessonProgress.student_id == user_id,
        Chapter.course_id == course_id
    ).all()

    if not progresses:
        return []

    return [
        {
            "lesson_id": p.lesson_id,
            "status": p.status.value
        }
        for p in progresses
    ]


def get_progress_percent(user_id, course_id):
    total_lessons = db.session.query(func.count()).select_from(Lesson)\
        .join(Chapter)\
        .filter(
            Chapter.course_id == course_id,
            Lesson.active.is_(True)
        ).scalar()

    if total_lessons == 0:
        return 0

    completed = db.session.query(func.count()).select_from(LessonProgress)\
        .join(Lesson)\
        .join(Chapter)\
        .filter(
            LessonProgress.student_id == user_id,
            LessonProgress.status == LessonProgressStatus.COMPLETED,
            Chapter.course_id == course_id,
            Lesson.active.is_(True)
        ).scalar()

    return round((completed / total_lessons) * 100, 2)


def start_lesson(user_id, lesson_id):
    progress = LessonProgress.query.filter_by(
        student_id=user_id,
        lesson_id=lesson_id
    ).first()

    if not progress:
        progress = LessonProgress(
            student_id=user_id,
            lesson_id=lesson_id,
            status=LessonProgressStatus.IN_PROGRESS
        )
        db.session.add(progress)

    elif progress.status != LessonProgressStatus.COMPLETED:
        progress.status = LessonProgressStatus.IN_PROGRESS
        
    db.session.commit()

    return progress


def complete_lesson(user_id, lesson_id):
    progress = LessonProgress.query.filter_by(
        student_id=user_id,
        lesson_id=lesson_id
    ).first()

    if not progress:
        progress = LessonProgress(
            student_id=user_id,
            lesson_id=lesson_id,
            status=LessonProgressStatus.COMPLETED
        )
        db.session.add(progress)
    else:
        progress.status = LessonProgressStatus.COMPLETED

    db.session.commit()
    lesson = Lesson.query.get(lesson_id)

    if lesson and lesson.chapter:
        course_id = lesson.chapter.course_id
        percent = get_progress_percent(user_id, course_id)

        if percent >= 100:
            create_certificate_if_not_exists(user_id, course_id)
