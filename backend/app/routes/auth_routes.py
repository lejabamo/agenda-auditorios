from flask import Blueprint, request, jsonify
from sqlalchemy import select
from ..db import SessionLocal
from ..models.admin_user import AdminUser
from ..auth.jwt import generate_token
from ..auth.decorators import admin_required

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
