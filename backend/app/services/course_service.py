from flask import request

from app.models.course import Course
from app.models.user import User
from app.models.category import Category
from app.models.enrollment import Enrollment
from app.enums.user_role import UserRole
from app.enums.course_type import CourseType
from app.configs.database_config import db
import app.services.category_service as CategoryService
import app.services.cloudinary_service as CloudinaryService

def find_course_by_id(id):
    course = Course.query.get(id)
    if not course:
        raise Exception("Khóa học không tồn tại")
    return course
    
def get_my_courses(data, user_id):
    page = int(data.get("page", 1))
    size = int(data.get("size", 10))

    query = db.session.query(Course).join(Enrollment).filter(
        Enrollment.user_id == user_id,
        Course.active.is_(True)
    ).order_by(Enrollment.created_at.desc())

    pagination = query.paginate(page=page, per_page=size, error_out=False)

    return {
        "items": pagination.items,
        "page": page,
        "size": size,
        "total": pagination.total,
        "total_pages": pagination.pages
    }

def get_courses_by_category(category_id, exclude_id=None, limit=5):
    category = db.session.get(Category, category_id)
    if not category:
        return []

    parent_id = category.parent_id if category.parent_id else category.id

    sibling_ids = [
        c.id for c in Category.query.filter_by(parent_id=parent_id).all()
    ]

    query = Course.query.filter(
        Course.category_id.in_(sibling_ids),
        Course.active == True
    )

    if exclude_id:
        query = query.filter(Course.id != exclude_id)

    courses = query.limit(limit).all()

    return [{
        "id": c.id,
        "name": c.name,
        "thumbnail": c.thumbnail or "",
        "price": float(c.price) if c.price else 0
    } for c in courses]

def find_courses(data, is_admin=False):
    name = data.get("name", "").strip()
    slug_path = data.get("category")
    min_price = data.get("min_price")
    max_price = data.get("max_price")
    level = data.get("level")

    page = int(data.get("page", 1))
    size = int(data.get("size", 10))

    query = Course.query
    if not is_admin:
        query = query.filter(Course.active.is_(True))

    if name:
        query = query.filter(Course.name.ilike(f"%{name}%"))

    if min_price:
        try:
            query = query.filter(Course.price >= float(min_price))
        except ValueError:
            pass
            
    if max_price:
        try:
            query = query.filter(Course.price <= float(max_price))
        except ValueError:
            pass
    if level:
        query = query.filter(Course.level == level)

    if slug_path and slug_path.strip(): 
        category = CategoryService.find_category_by_slug_path(slug_path)

        if not category:
            return {
                "items": [],
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0
            }

        ids = CategoryService.get_all_child_ids(category)
        query = query.filter(Course.category_id.in_(ids))

    pagination = query.order_by(Course.id.desc()).paginate(page=page, per_page=size, error_out=False)

    return {
        "items": pagination.items,
        "page": page,
        "size": size,
        "total": pagination.total,
        "total_pages": pagination.pages
    }

def add_course(data, file, user_id):
    instructor = User.query.get(user_id)
    if not instructor:
        raise Exception("Người dùng không tồn tại")

    if instructor.role != UserRole.INSTRUCTOR:
        raise Exception("Bạn không có quyền tạo khóa học")
    
    category = Category.query.get(data.get("category_id"))
    if not category:
        raise Exception("Danh mục không tồn tại")

    name = data.get("name","").strip()
    subtitle = data.get("subtitle","").strip()
    type_str = data.get("type")
    price = data.get("price")
    description = data.get("description")
    level = data.get("level", "beginner")

    thumbnail_url = None
    if file:
        thumbnail_url = CloudinaryService.upload_thumbnail(file, user_id)

    if not name:
        raise Exception("Tên khóa học không được để trống")

    if not subtitle:
        raise Exception("Subtitle không được để trống")

    if price is None:
        raise Exception("Giá không được để trống")

    if not type_str:
        raise Exception("Type không hợp lệ")
    
    try:
        course_type = CourseType[type_str]
    except KeyError:
        raise Exception("Type không hợp lệ (TỰ CHỌN / BẮT BUỘC)")
    
    existed = Course.query.filter_by(
        name = name,
        instructor_id = user_id
    ).first()

    if existed:
        raise Exception("Bạn đã tạo khóa học này")
    
    new_course = Course(
        name = name,
        subtitle = subtitle,
        type = course_type,
        price = price,
        description = description,
        thumbnail = thumbnail_url,
        instructor_id = instructor.id,
        category_id = category.id,
        level=level
    )

    db.session.add(new_course)
    db.session.commit()

    return new_course

def update_course(data, file, user_id, course_id):
    course = Course.query.get(course_id)

    if not course:
        raise Exception("Khóa học không tồn tại")

    if course.instructor_id != user_id:
        raise Exception("Bạn không có quyền sửa khóa học này")
    
    name = data.get("name", "").strip()
    subtitle = data.get("subtitle", "").strip()
    type_str = data.get("type")
    price = data.get("price")
    level = data.get("level")
    
    if "category_id" in data and data.get("category_id"):
        course.category_id = data.get('category_id')

    if name:
        existed = Course.query.filter(
            Course.name == name,
            Course.instructor_id == user_id,
            Course.id != course_id
        ).first()

        if existed:
            raise Exception("Bạn đã có khóa học trùng tên")

        course.name = name

    if "subtitle" in data:
        course.subtitle = subtitle

    if type_str:
        try:
            course.type = CourseType[type_str]
        except KeyError:
            raise Exception("Type không hợp lệ")

    if price is not None:
        if float(price) < 0:
            raise Exception("Giá phải >= 0")
        course.price = price

    if "description" in data:
        course.description = data.get("description")

    if level:
        course.level = level

    thumbnail_url = None
    if file:
        thumbnail_url = CloudinaryService.upload_thumbnail(file, user_id)
        course.thumbnail = thumbnail_url

    if "active" in data:
        active_value = data.get("active")

        if isinstance(active_value, bool):
            course.active = active_value
        else:
            course.active = str(active_value).lower() == "true"

    db.session.commit()

    return course

def delete_course(user_id, course_id):
    user = User.query.get(user_id)
    course = Course.query.get(course_id)

    if not user:
        raise Exception("User không tồn tại")

    if not course:
        raise Exception("Khóa học không tồn tại")

    if user.role != UserRole.INSTRUCTOR:
        raise Exception("Không có quyền")

    if course.instructor_id != user_id:
        raise Exception("Không phải khóa học của bạn")

    course.active = False

    db.session.commit()

    return course

def find_instructor_manage_courses(user_id):
    courses = Course.query.filter_by(
        instructor_id=user_id
    ).order_by(Course.id.desc()).all()

    return courses