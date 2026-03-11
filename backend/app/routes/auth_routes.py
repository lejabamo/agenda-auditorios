from flask import Blueprint, request, jsonify
from sqlalchemy import select
from ..db import SessionLocal
from ..models.admin_user import AdminUser
from ..auth.jwt import generate_token, generate_recovery_token, decode_token
from ..auth.decorators import admin_required
from ..services.email_service import EmailService

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400

    session = SessionLocal()
    try:
        stmt = select(AdminUser).where(AdminUser.email == data["email"])
        admin = session.execute(stmt).scalar_one_or_none()

        if admin and admin.check_password(data["password"]):
            if not admin.is_active:
                return jsonify({"error": "Account is inactive"}), 401
            
            token = generate_token(admin.id)
            return jsonify({
                "access_token": token,
                "token_type": "Bearer",
                "user": admin.to_dict()
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    finally:
        session.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Stateless JWT logout - client just discards token.
    # We return 200 to acknowledge.
    return jsonify({"message": "Logged out successfully"}), 200

@auth_bp.route('/me', methods=['GET'])
@admin_required
def get_current_user():
    # Endpoint to verify token validity and get user info
    # We can get the ID from the token payload (need to refactor admin_required slightly or parse again)
    # For now, let's just return a valid status. 
    # Ideally admin_required puts user in g or request.
    
    # Simple valid check
    return jsonify({"status": "authenticated", "role": "ADMIN"}), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True)
    if not data or not data.get("email"):
        return jsonify({"error": "Email required"}), 400

    email = data.get("email")
    frontend_url = data.get("frontend_url", "http://localhost:5173")

    session = SessionLocal()
    try:
        stmt = select(AdminUser).where(AdminUser.email == email)
        admin = session.execute(stmt).scalar_one_or_none()
        
        if admin:
            token = generate_recovery_token(admin.id)
            EmailService.send_password_recovery(admin.email, token, frontend_url)

        # Always return 200 to not leak email existence
        return jsonify({"message": "If the email is registered, a recovery link has been sent."}), 200
    finally:
        session.close()

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True)
    if not data or not data.get("token") or not data.get("password"):
        return jsonify({"error": "Token and password required"}), 400

    token = data.get("token")
    new_password = data.get("password")

    payload = decode_token(token)
    if not payload or payload.get("role") != "RECOVERY":
        return jsonify({"error": "Invalid or expired token"}), 400

    admin_id = payload.get("sub")
    
    session = SessionLocal()
    try:
        stmt = select(AdminUser).where(AdminUser.id == admin_id)
        admin = session.execute(stmt).scalar_one_or_none()
        
        if not admin:
            return jsonify({"error": "User not found"}), 404

        admin.set_password(new_password)
        session.commit()
        
        return jsonify({"message": "Password updated successfully"}), 200
    finally:
        session.close()
