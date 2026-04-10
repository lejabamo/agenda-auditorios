import os
import logging
import json
from flask import Blueprint, request, jsonify
from datetime import datetime

logger = logging.getLogger(__name__)
assistance_bp = Blueprint('assistance', __name__, url_prefix='/api/assistance')

@assistance_bp.route('/check', methods=['GET'])
def check_status():
    """Ruta de diagnóstico para verificar salud del servicio."""
    try:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        lib_ok = False
        try:
            import google.generativeai
            lib_ok = True
        except ImportError:
            lib_ok = False

        return jsonify({
            "status": "online",
            "ready": True,
            "has_key": len(api_key) > 0,
            "library_installed": lib_ok,
            "today": datetime.now().strftime('%Y-%m-%d')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_gemini_response(prompt):
    """Llamada segura a Gemini AI con manejo de errores robusto."""
    try:
        import google.generativeai as genai
    except ImportError:
        logger.error("google-generativeai no está instalado en el contenedor")
        return None

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("FALTA GEMINI_API_KEY en el entorno")
        return None
    
    try:
        genai.configure(api_key=api_key)
        # Usamos flash por velocidad y costo
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"DETALLE ERROR GOOGLE GEMINI: {str(e)}")
        return None

@assistance_bp.route('/process', methods=['POST'])
def process_query():
    """Motor de NLU que interpreta lenguaje natural y lo convierte en intenciones JSON."""
    try:
        data = request.get_json()
        query = data.get('query')
        today = data.get('today', datetime.now().strftime('%Y-%m-%d'))
        
        if not query:
            return jsonify({"error": "No se proporcionó ninguna consulta"}), 400

        # Prompt optimizado para tolerancia a errores tipográficos y lenguaje informal
        system_prompt = f"""
        Eres un motor de interpretación de lenguaje natural (NLU) para un sistema de auditorios.
        Hoy es {today} (Día: {datetime.now().strftime('%A')}).
        
        CRÍTICO: El usuario puede tener errores de ortografía (ej: "procima", "osupado", "libere"). 
        Ignora los errores y enfócate en la intención.
        
        Intenciones posibles: 
        - 'AVAILABILITY': Pregunta si algo está libre o desocupado.
        - 'AGENDA': Pregunta qué eventos ya están programados.
        - 'GREETING': Saludos básicos.
        
        Formato de salida (JSON ESTRICTO):
        {{
            "intent": "AVAILABILITY" | "AGENDA" | "GREETING",
            "date": "YYYY-MM-DD" (calcula basado en {today}),
            "jornada": "MAÑANA" | "TARDE" | "TODO_EL_DIA" | null,
            "range": "week" | "month" | "day" | null,
            "reasoning": "breve explicación"
        }}
        
        Ejemplo: "¿que tarde esta libre la proxima semana?" 
        -> {{"intent": "AVAILABILITY", "date": "próximo lunes", "jornada": "TARDE", "range": "week", "reasoning": "Semana próxima tarde"}}
        
        Consulta del usuario: "{query}"
        Responde SOLO el JSON.
        """
        
        raw_response = get_gemini_response(system_prompt)
        if not raw_response:
            return jsonify({"error": "La IA no respondió o la llave es inválida"}), 503
            
        # Limpieza de markdown en la respuesta de la IA
        json_str = raw_response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[-1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[-1].split("```")[0].strip()
            
        try:
            interpretation = json.loads(json_str)
            return jsonify({
                "success": True,
                "interpretation": interpretation
            })
        except json.JSONDecodeError:
            logger.error(f"Error parseando JSON de IA: {json_str}")
            return jsonify({"error": "Formato de respuesta inválido de la IA"}), 500

    except Exception as e:
        logger.exception("Error crítico en el procesador de asistencia")
        return jsonify({"error": "Error interno del motor de asistencia"}), 500
