from app.configs.database_config import db
from app.enums.course_type import CourseType
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import Numeric, UniqueConstraint
from sqlalchemy.orm import relationship

class Course(db.Model):
    __tablename__ = "courses"

    __table_args__ = (
        UniqueConstraint('name', 'instructor_id', name='uq_course_name_instructor'),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subtitle = db.Column(db.String(100), nullable=False)
    type = db.Column(SqlEnum(CourseType), nullable=False)
    price = db.Column(Numeric(10,2), nullable=False)
    description = db.Column(db.Text)
    thumbnail = db.Column(db.String(500))
    active = db.Column(db.Boolean, default=True, nullable=False)
    level = db.Column(db.String(50), nullable=True)

    roadmap = db.Column(db.String(100), nullable=True)
    roadmap_order = db.Column(db.Integer, nullable=True)

    instructor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)

    chapters = relationship("Chapter", backref="course", cascade="all, delete-orphan", order_by="Chapter.order_index")
    enrollments = db.relationship("Enrollment", backref="course", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "subtitle": self.subtitle,
            "type": self.type.name,
            "price": float(self.price) if self.price is not None else 0,
            "description": self.description,
            "thumbnail": self.thumbnail,
            "active": self.active,
            "level": self.level,
            "instructor_id": self.instructor_id,
            "category_id": self.category_id,
            "chapters": [c.to_dict() for c in self.chapters if c.active],
            "roadmap": self.roadmap,
            "roadmap_order": self.roadmap_order
        }