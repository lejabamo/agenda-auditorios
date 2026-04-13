import os
import logging
import json
import requests
from flask import Blueprint, request, jsonify
from datetime import datetime

logger = logging.getLogger(__name__)
assistance_bp = Blueprint('assistance', __name__, url_prefix='/api/assistance')

@assistance_bp.route('/check', methods=['GET'])
def check_status():
    """Ruta de diagnóstico para verificar salud del servicio."""
    try:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        return jsonify({
            "status": "online",
            "ready": True,
            "has_key": len(api_key) > 5,
            "method": "Direct API (requests)",
            "today": datetime.now().strftime('%Y-%m-%d')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def call_gemini_direct(prompt):
    """Llamada directa a la API de Google sin usar el SDK."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("ERROR: GEMINI_API_KEY no encontrada")
        return None

    # URL oficial de la API de Google Gemini (v1)
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        # Si falla el flash (404/503), intentamos el pro
        if response.status_code != 200:
            logger.info(f"Flash falló ({response.status_code}), intentando con gemini-pro...")
            url_pro = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={api_key}"
            response = requests.post(url_pro, headers=headers, json=payload, timeout=20)

        response.raise_for_status()
        res_json = response.json()
        return res_json['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        logger.error(f"FALLO CRITICO API DIRECTA: {str(e)}")
        if hasattr(e, 'response') and e.response:
             logger.error(f"RESPUESTA GOOGLE: {e.response.text}")
        return None

@assistance_bp.route('/process', methods=['POST'])
def process_query():
    """Motor de NLU usando llamadas directas HTTP."""
    try:
        data = request.get_json()
        query = data.get('query')
        today = data.get('today', datetime.now().strftime('%Y-%m-%d'))
        
        if not query:
            return jsonify({"error": "Consulta vacía"}), 400

        system_prompt = f"""
        Eres un NLU para auditorios. Hoy es {today}.
        Interpreta la intención. SALIDA: JSON estricto.
        Intenciones: AVAILABILITY, AGENDA, GREETING.
        
        Usuario dice: "{query}"
        """
        
        raw_response = call_gemini_direct(system_prompt)
        
        if not raw_response:
            return jsonify({"error": "Error al conectar con la IA de Google"}), 503
            
        json_str = raw_response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[-1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[-1].split("```")[0].strip()
            
        try:
            interpretation = json.loads(json_str)
            return jsonify({"success": True, "interpretation": interpretation})
        except:
             return jsonify({
                 "success": True, 
                 "interpretation": {"intent": "GREETING", "reasoning": "Respuesta directa", "text": raw_response}
             })

    except Exception as e:
        logger.exception("Error en process_query")
        return jsonify({"error": str(e)}), 500
