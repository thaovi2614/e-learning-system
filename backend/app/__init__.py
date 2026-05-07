from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import traceback
from flask import send_from_directory
import os


from app.configs.config import Config
from app.configs.database_config import init_db
from app.configs.jwt_config import init_jwt
from app.configs.cloudinary_config import init_cloudinary
from app.configs.socketIO_config import init_socketIO

from app.controllers.auth_controller import auth_bp
from app.controllers.category_controller import category_bp
from app.controllers.course_controller import course_bp
from app.controllers.enrollment_controller import enrollment_bp
from app.controllers.cart_controller import cart_bp
from app.controllers.payment_controller import payment_bp
from app.controllers.lesson_controller import lesson_bp
from app.controllers.quiz_controller import quiz_bp
from app.controllers.progress_controller import progress_bp
from app.controllers.chapter_controller import chapter_bp
from app.controllers.user_controller import user_bp
from app.controllers.conversation_controller import conversation_bp
from app.controllers.message_controller import message_bp

from app import models
import app.sockets.socket_events

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:5173"]
    )

    # Init extensions
    init_db(app)
    init_jwt(app)
    init_cloudinary(app)
    init_socketIO(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(enrollment_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(lesson_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(chapter_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(conversation_bp)
    app.register_blueprint(message_bp)

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return jsonify({
                "success": False,
                "message": e.description
            }), e.code

        return jsonify({
            "success": False,
            "message": "Internal Server Error"
        }), 500
    
    # @app.errorhandler(Exception)
    # def handle_exception(e):
    #     traceback.print_exc()
    #     return jsonify({
    #         "message": str(e),
    #         "success": False
    #     }), 500
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)
    return app