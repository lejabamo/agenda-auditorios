from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.evento_service import EventoService
from ..exceptions import AgendaConflictError, ValidationError

evento_bp = Blueprint('eventos', __name__, url_prefix='/api/eventos')

def get_service():
    session = SessionLocal()
    return EventoService(session), session

@evento_bp.route('/', methods=['POST'])
def create_evento():
    service, session = get_service()
    try:
        data = request.get_json()
        # Basic validation of required fields
        required_fields = [
            'titulo', 'fecha_inicio', 'fecha_fin', 'jornada', 'auditorio_id', 'dependencia_id',
            'responsable_nombre', 'responsable_telefono', 'correo_confirmacion'
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} es obligatorio'}), 400
        
        nuevo = service.create(data)
        return jsonify({
            'id': nuevo.id,
            'titulo': nuevo.titulo,
            'estado': nuevo.estado,
            'fecha_inicio': nuevo.fecha_inicio.isoformat(),
            'fecha_fin': nuevo.fecha_fin.isoformat()
        }), 201
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AgendaConflictError as e:
        return jsonify({'error': str(e)}), 409
    finally:
        session.close()

@evento_bp.route('/', methods=['GET'])
def list_eventos():
    service, session = get_service()
    try:
        eventos = service.get_all()
        return jsonify([
            {
                'id': e.id,
                'titulo': e.titulo,
                'fecha_inicio': e.fecha_inicio.isoformat(),
                'fecha_fin': e.fecha_fin.isoformat(),
                'estado': e.estado,
                'auditorio_id': e.auditorio_id,
                'dependencia_id': e.dependencia_id
            } for e in eventos
        ]), 200
    finally:
        session.close()

@evento_bp.route('/<int:id>', methods=['GET'])
def get_evento(id):
    service, session = get_service()
    try:
        evento = service.get_by_id(id)
        if not evento:
            return jsonify({'error': 'Evento no encontrado'}), 404
        
        return jsonify({
            'id': evento.id,
            'titulo': evento.titulo,
            'descripcion': evento.descripcion,
            'fecha_inicio': evento.fecha_inicio.isoformat(),
            'fecha_fin': evento.fecha_fin.isoformat(),
            'jornada': evento.jornada,
            'aforo_estimado': evento.aforo_estimado,
            'estado': evento.estado,
            'requiere_microfono': evento.requiere_microfono,
            'requiere_videobeam': evento.requiere_videobeam,
            'requiere_sonido': evento.requiere_sonido,
            'requiere_asistencia_tecnica': evento.requiere_asistencia_tecnica,
            'auditorio_id': evento.auditorio_id,
            'dependencia_id': evento.dependencia_id
        }), 200
    finally:
        session.close()

@evento_bp.route('/<int:id>', methods=['DELETE'])
def cancel_evento(id):
    service, session = get_service()
    try:
        success = service.cancel(id)
        if not success:
            return jsonify({'error': 'Evento no encontrado'}), 404
        
        return jsonify({'message': 'Evento cancelado correctamente'}), 200
    finally:
        session.close()
