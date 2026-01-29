from flask import Flask, jsonify
from sqlalchemy import text
from .db import SessionLocal
from .routes.auditorio_routes import auditorio_bp
from .routes.dependencia_routes import dependencia_bp
from .routes.evento_routes import evento_bp

def create_app():
    app = Flask(__name__)

    # Flask config (if we had any specific flask config, we could load it here)
    # app.config.from_object('app.config.Config') 
    # For now, we rely on env vars for DB which are handled in db.py

    app.register_blueprint(auditorio_bp)
    app.register_blueprint(dependencia_bp)
    app.register_blueprint(evento_bp)

    @app.teardown_appcontext
    def remove_session(exception=None):
        SessionLocal.close_all()

    @app.route("/health")
    def health():
        return jsonify(status="ok"), 200

    @app.route("/db-check")
    def db_check():
        try:
            session = SessionLocal()
            result = session.execute(text("SELECT 1"))
            session.close() # or let teardown handle it, but explicit is good for check
            return jsonify(db="ok", result=result.scalar())
        except Exception as e:
            return jsonify(db="error", error=str(e)), 500

    return app
