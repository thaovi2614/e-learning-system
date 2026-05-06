from flask_socketio import SocketIO

socketio = SocketIO(cors_allowed_origins=["http://localhost:5173"], async_mode="eventlet")

def init_socketIO(app):
    socketio.init_app(app)
    return socketio