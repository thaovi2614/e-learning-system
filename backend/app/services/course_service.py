from app.models.course import Course
from app.models.user import User
from app.models.category import Category
from app.enums.user_role import UserRole
from app.enums.course_type import CourseType
from app.configs.database_config import db

def find_course_by_id(id):
    course = Course.query.get(id)
    if not course:
        raise Exception("Khóa học không tồn tại")
    return course

def find_courses(data, is_admin=False):
    name = data.get("name","").strip()

    page = int(data.get("page", 1))
    size = int(data.get("size", 10))

    query = Course.query
    if not is_admin:
        query = query.filter(Course.active.is_(True))

    if name:
        query = query.filter(Course.name.ilike(f"%{name}%"))

    pagination = query.paginate(page=page, per_page=size, error_out=False)

    return {
        "items": pagination.items,
        "page": page,
        "size": size,
        "total": pagination.total,
        "total_pages": pagination.pages
    }

def add_course(data, user_id):
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
    thumbnail = data.get("thumbnail")

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
        thumbnail = thumbnail,
        instructor_id = instructor.id,
        category_id = category.id
    )

    db.session.add(new_course)
    db.session.commit()

    return new_course

def update_course(data, user_id, course_id):
    course = Course.query.get(course_id)

    if not course:
        raise Exception("Khóa học không tồn tại")

    if course.instructor_id != user_id:
        raise Exception("Bạn không có quyền sửa khóa học này")
    
    name = data.get("name","").strip()
    subtitle = data.get("subtitle","").strip()
    type_str = data.get("type")
    price = data.get("price")

    if name:
        existed = Course.query.filter(
            Course.name == name,
            Course.instructor_id == user_id,
            Course.id != course_id
        ).first()

        if existed:
            raise Exception("Bạn đã có khóa học trùng tên")

        course.name = name

    if subtitle is not None:
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

    course.description = data.get("description")
    course.thumbnail = data.get("thumbnail")

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