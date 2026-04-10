import os
import logging
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)
assistance_bp = Blueprint('assistance', __name__, url_prefix='/api/assistance')

@assistance_bp.route('/check', methods=['GET'])
def check_status():
    """Ruta ultra-simple para diagnosticar el servidor."""
    try:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        return jsonify({
            "ready": True,
            "message": "Servidor de Asistencia Activo",
            "has_key": len(api_key) > 0
        })
    except Exception as e:
        return str(e), 500

@assistance_bp.route('/process', methods=['POST'])
def process():
    """Respuesta temporal para no romper el frontend."""
    return jsonify({
        "success": True,
        "interpretation": {
            "intent": "GREETING",
            "reasoning": "Modo diagnóstico activo"
        }
    })
