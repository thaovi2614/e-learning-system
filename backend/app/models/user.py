from app.configs.database_config import db
from app.enums.user_role import UserRole
from sqlalchemy import Enum as SqlEnum
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(SqlEnum(UserRole), nullable=False, default=UserRole.STUDENT)
    avatar = db.Column(db.String(500))
    active = db.Column(db.Boolean, default=True, nullable=False)
    level = db.Column(db.String(50), nullable=True)
    learning_goal = db.Column(db.String(100), nullable=True)

    messages = db.relationship("Message", backref="sender", lazy=True)
    enrollments = db.relationship("Enrollment", backref="user", lazy=True)
    questions = db.relationship("Question", backref="student", lazy=True)
    answers = db.relationship("Answer", backref="user", lazy=True)

    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "role": self.role.name,
            "avatar": self.avatar,
            "level": self.level,
            "learning_goal": self.learning_goal
        }
    
    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)