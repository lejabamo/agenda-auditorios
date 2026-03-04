from flask import Blueprint, jsonify, g
from ..auth.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/health', methods=['GET'])
@admin_required
def admin_health():
    """Simple protected route to verify token validation."""
    return jsonify({
        "status": "admin-ok",
        "admin_id": g.admin_id
    }), 200
