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
        You are a ROBUST NLU (Natural Language Understanding) engine for an auditorium booking system.
        Today's date is {today} (day of week: {datetime.strptime(today, '%Y-%m-%d').strftime('%A')}).
        
        CRITICAL: The user might have typos (e.g., "procima" instead of "próxima", "osupado" instead of "ocupado").
        Ignore grammar/spelling errors and focus on the user's intent.
        
        Intent types: 
        - 'AVAILABILITY': Asking if a slot or range is free.
        - 'AGENDA': Asking to see what is already booked.
        - 'GREETING': Basic hello/who are you.
        
        Output format (STRICT JSON):
        {{
            "intent": "AVAILABILITY" | "AGENDA" | "GREETING" | "UNKNOWN",
            "date": "YYYY-MM-DD" (calculate relative to {today}),
            "jornada": "MAÑANA" | "TARDE" | "TODO_EL_DIA" | null,
            "range": "week" | "month" | "day" | null,
            "reasoning": "short explanation"
        }}
        
        Examples:
        - "que hay libre la procima semana?" -> {{"intent": "AVAILABILITY", "date": "next_monday", "jornada": null, "range": "week", "reasoning": "Next week with typos"}}
        - "esta osupado mañana?" -> {{"intent": "AVAILABILITY", "date": "{today}+1", "jornada": "TODO_EL_DIA", "range": "day", "reasoning": "Tomorrow with typos"}}
        - "¿que tarde esta libre?" -> {{"intent": "AVAILABILITY", "date": "{today}", "jornada": "TARDE", "range": "day", "reasoning": "Current day afternoon"}}
        
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
