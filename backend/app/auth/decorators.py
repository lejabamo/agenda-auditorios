from functools import wraps
from flask import request, jsonify, g
from .jwt import decode_token

def admin_required(f):
    """Decorator to protect routes requiring Admin access."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
            
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
             return jsonify({"error": "Authorization header must be Bearer token"}), 401
        
        token = parts[1]
        payload = decode_token(token)
        
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        if payload.get("role") != "ADMIN":
            return jsonify({"error": "Insufficient permissions"}), 403

        # Inject admin_id into context
        g.admin_id = payload["sub"]
        
        return f(*args, **kwargs)
    return decorated_function
