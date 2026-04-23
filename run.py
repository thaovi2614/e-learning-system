from app import create_app
from app.configs.database_config import db
from flask_jwt_extended import JWTManager

app = create_app()
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    jwt = JWTManager(app)
    app.run(debug=True)