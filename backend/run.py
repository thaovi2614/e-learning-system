from app import create_app
from flask_jwt_extended import JWTManager

app = create_app()

if __name__ == "__main__":
    jwt = JWTManager(app)
    app.run(debug=True)