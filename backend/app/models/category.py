from app.configs.database_config import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(255), unique=True, nullable=True)
    active = db.Column(db.Boolean, default=True, nullable=False)

    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"))
    parent = db.relationship("Category", remote_side=[id], backref="children")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "active": self.active,
            "parent_id": self.parent_id
        }