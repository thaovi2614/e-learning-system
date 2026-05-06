from app import create_app
from app.configs.database_config import db
from app.configs.socketIO_config import socketio
from flask_jwt_extended import JWTManager

app = create_app()
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    jwt = JWTManager(app)
    socketio.run(app, debug=True)