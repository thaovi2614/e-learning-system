from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import traceback

from app.configs.config import Config
from app.configs.database_config import init_db
from app.configs.jwt_config import init_jwt
from app.configs.cloudinary_config import init_cloudinary

from app.controllers.auth_controller import auth_bp
from app.controllers.category_controller import category_bp
from app.controllers.course_controller import course_bp
from app.controllers.cart_controller import cart_bp
from app.controllers.payment_controller import payment_bp

from app import models

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

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(course_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(payment_bp)

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
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        traceback.print_exc()
        return jsonify({
            "message": str(e),
            "success": False
        }), 500

    return app