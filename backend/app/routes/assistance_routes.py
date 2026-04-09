import os
import logging
import json
from flask import Blueprint, request, jsonify
import google.generativeai as genai
from datetime import datetime

logger = logging.getLogger(__name__)
assistance_bp = Blueprint('assistance', __name__, url_prefix='/api/assistance')

def get_gemini_response(prompt):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment")
        return None
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.exception("Error calling Gemini API")
        return None

@assistance_bp.route('/process', methods=['POST'])
def process_query():
    try:
        data = request.get_json()
        query = data.get('query')
        today = data.get('today', datetime.now().strftime('%Y-%m-%d'))
        
        if not query:
            return jsonify({"error": "No query provided"}), 400

        system_prompt = f"""
        You are a NLU (Natural Language Understanding) engine for an auditorium booking system.
        Today's date is {today} (day of week: {datetime.strptime(today, '%Y-%m-%d').strftime('%A')}).
        
        Translate the user's query into a structured JSON object. 
        Important: If the user asks for "esta semana" or "la otra semana", set range to "week".
        If they ask for specific jornadas like "por la tarde", set jornada to "TARDE".
        
        Intent types: 
        - 'AVAILABILITY': Asking if a slot or range is free.
        - 'AGENDA': Asking to see what is already booked.
        - 'GREETING': Basic hello/who are you.
        
        Output format (STRICT JSON):
        {{
            "intent": "AVAILABILITY" | "AGENDA" | "GREETING" | "UNKNOWN",
            "date": "YYYY-MM-DD" (the specific date or the START of the range),
            "jornada": "MAÑANA" | "TARDE" | "TODO_EL_DIA" | null,
            "range": "week" | "month" | "day" | null,
            "reasoning": "short explanation of date calculation"
        }}
        
        Examples:
        - "¿Qué tardes están libres la próxima semana?" -> {{"intent": "AVAILABILITY", "date": "2026-04-13", "jornada": "TARDE", "range": "week", "reasoning": "Next monday"}}
        - "¿Qué hay para mañana?" -> {{"intent": "AGENDA", "date": "{today} + 1 day", "jornada": null, "range": "day", "reasoning": "Tomorrow"}}
        - "hay algo libre el viernes 10?" -> {{"intent": "AVAILABILITY", "date": "2026-04-10", "jornada": "TODO_EL_DIA", "range": "day", "reasoning": "Specific date"}}
        
        User query: "{query}"
        Return ONLY valid JSON.
        """
        
        raw_response = get_gemini_response(system_prompt)
        if not raw_response:
            return jsonify({"error": "AI service unavailable"}), 503
            
        # Clean response if LLM adds markdown backticks
        json_str = raw_response.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:-3]
        elif json_str.startswith("```"):
            json_str = json_str[3:-3]
            
        interpretation = json.loads(json_str.strip())
        
        return jsonify({
            "success": True,
            "interpretation": interpretation
        })

    except Exception as e:
        logger.exception("Error in assistance/process")
        return jsonify({"error": "Internal processor error"}), 500
