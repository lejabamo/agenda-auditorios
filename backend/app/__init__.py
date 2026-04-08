import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import text
from .db import SessionLocal
from .services.email_service import mail
from .routes.auditorio_routes import auditorio_bp
from .routes.dependencia_routes import dependencia_bp
from .routes.evento_routes import evento_bp

logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)

    # Mail Configuration (from environment variables)
    import os
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'localhost')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 1025))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'false').lower() in ['true', '1', 't']
    app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', '1', 't']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@agenda.com')
    mail.init_app(app)

    # CORS: allow only configured origins, never wildcard in production
    allowed_origins = os.environ.get(
        'CORS_ALLOWED_ORIGINS', 'http://localhost:5173'
    ).split(',')
    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Global error handler — never expose internal error details in production
    @app.errorhandler(Exception)
    def handle_all_exceptions(e):
        import traceback
        logger.error("Unhandled exception: %s", traceback.format_exc())
        debug_mode = app.config.get("DEBUG", False)
        return jsonify({
            "message": "Error interno del servidor",
            "detail": str(e) if debug_mode else None
        }), 500

    # Register blueprints
    app.register_blueprint(auditorio_bp)
    app.register_blueprint(dependencia_bp)
    app.register_blueprint(evento_bp)

    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    from .routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp)

    from .routes.assistance_routes import assistance_bp
    app.register_blueprint(assistance_bp)

    # Session teardown
    @app.teardown_appcontext
    def remove_session(exception=None):
        SessionLocal.close_all()

    # Health check endpoint
    @app.route("/health")
    def health():
        return jsonify(status="ok"), 200

    # DB connectivity check (useful for infrastructure monitoring)
    @app.route("/db-check")
    def db_check():
        try:
            session = SessionLocal()
            result = session.execute(text("SELECT 1"))
            session.close()
            return jsonify(db="ok", result=result.scalar())
        except Exception as e:
            logger.error("DB check failed: %s", e)
            return jsonify(db="error"), 500

    # Register CLI commands
    from .cli.admin import create_admin_command, reset_admin_password_command
    app.cli.add_command(create_admin_command)
    app.cli.add_command(reset_admin_password_command)

    return app
