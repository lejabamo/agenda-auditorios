import logging
from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.evento_service import EventoService
from ..exceptions import AgendaConflictError, ValidationError
from ..auth.decorators import admin_required

logger = logging.getLogger(__name__)

evento_bp = Blueprint('eventos', __name__, url_prefix='/api/eventos')


def get_service():
    session = SessionLocal()
    return EventoService(session), session


@evento_bp.route('/', methods=['POST', 'OPTIONS'])
def create_evento():
    if request.method == "OPTIONS":
        return "", 204

    service, session = get_service()
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"status": "error", "message": "No JSON data provided", "code": "INVALID_JSON"}), 400

        required_fields = [
            'titulo', 'fecha_inicio', 'fecha_fin', 'jornada', 'auditorio_id', 'dependencia_id',
            'responsable_nombre', 'responsable_telefono', 'correo_confirmacion'
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Campos obligatorios faltantes: {', '.join(missing_fields)}",
                "code": "MISSING_FIELDS"
            }), 400

        nuevo = service.create(data)
        is_dry_run = data.get('dry_run', False)

        response_payload = {
            "success": True,
            "status": "ok",
            "message": "Validación exitosa (dry-run)" if is_dry_run else "Solicitud creada exitosamente",
            "id": nuevo.id if nuevo else None,
            "data": {
                "id": nuevo.id,
                "auditorio_id": nuevo.auditorio_id,
                "fecha_inicio": nuevo.fecha_inicio.isoformat(),
                "fecha_fin": nuevo.fecha_fin.isoformat(),
                "titulo": nuevo.titulo
            } if nuevo else {}
        }

        return jsonify(response_payload), 200 if is_dry_run else 201

    except ValidationError as e:
        session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e),
            "code": "VALIDATION_ERROR"
        }), 400

    except AgendaConflictError as e:
        session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e),
            "code": "CONFLICT_ERROR"
        }), 409

    except Exception as e:
        logger.exception("Unexpected error in POST /api/eventos/")
        session.rollback()
        return jsonify({
            "status": "error",
            "message": "Error interno al crear evento",
            "code": "INTERNAL_ERROR"
        }), 500
    finally:
        session.close()


@evento_bp.route('/hold', methods=['POST'])
def create_hold():
    service, session = get_service()
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        if not data.get('auditorio_id') or not data.get('fecha') or not data.get('jornada'):
            return jsonify({'message': 'Faltan campos (auditorio_id, fecha, jornada)'}), 400

        hold = service.create_hold(data)

        return jsonify({
            'success': True,
            'message': 'Bloqueo temporal creado',
            'id': hold.id,
            'data': {
                'id': hold.id,
                'fecha_inicio': hold.fecha_inicio.isoformat(),
                'fecha_fin': hold.fecha_fin.isoformat(),
                'estado': hold.estado
            }
        }), 201

    except ValidationError as e:
        session.rollback()
        return jsonify({'message': str(e)}), 400
    except AgendaConflictError as e:
        session.rollback()
        return jsonify({'message': str(e)}), 409
    except Exception as e:
        logger.exception("Unexpected error in POST /api/eventos/hold")
        session.rollback()
        return jsonify({'message': 'Error interno al crear bloqueo'}), 500
    finally:
        session.close()


@evento_bp.route('/', methods=['GET'])
def list_eventos():
    service, session = get_service()
    try:
        filters = {
            "fecha": request.args.get('fecha'),
            "auditorio_id": request.args.get('auditorio_id'),
            "estado": request.args.get('estado'),
            "sort_by": request.args.get('sort_by'),
            "order": request.args.get('order')
        }

        eventos = service.get_all(filters)
        return jsonify([
            {
                'id': e.id,
                'titulo': e.titulo,
                'fecha_inicio': e.fecha_inicio.isoformat(),
                'fecha_fin': e.fecha_fin.isoformat(),
                'estado': e.estado,
                'auditorio_id': e.auditorio_id,
                'auditorio_nombre': e.auditorio.nombre if e.auditorio else "Desconocido",
                'dependencia_id': e.dependencia_id,
                'dependencia_nombre': e.dependencia.nombre if e.dependencia else "Desconocida",
                'responsable_nombre': e.responsable_nombre
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
            'auditorio_nombre': evento.auditorio.nombre if evento.auditorio else "Desconocido",
            'dependencia_id': evento.dependencia_id,
            'dependencia_nombre': evento.dependencia.nombre if evento.dependencia else "Desconocida",
            'responsable_nombre': evento.responsable_nombre,
            'created_at': evento.created_at.isoformat(),
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


@evento_bp.route('/admin-direct', methods=['POST', 'OPTIONS'])
@admin_required
def create_admin_direct():
    """Admin creates an event directly as APROBADO, bypassing user-facing time restrictions."""
    if request.method == "OPTIONS":
        return "", 204

    from flask import g
    service, session = get_service()
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        required = ['titulo', 'fecha_inicio', 'fecha_fin', 'jornada', 'auditorio_id',
                    'responsable_nombre', 'responsable_telefono', 'correo_confirmacion']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({"error": f"Campos obligatorios: {', '.join(missing)}"}), 400

        data['admin_id'] = g.admin_id
        evento = service.create_admin_direct(data)

        return jsonify({
            "success": True,
            "message": "Evento creado y aprobado exitosamente",
            "id": evento.id,
            "data": {
                "id": evento.id,
                "titulo": evento.titulo,
                "fecha_inicio": evento.fecha_inicio.isoformat(),
                "fecha_fin": evento.fecha_fin.isoformat(),
                "estado": evento.estado,
                "auditorio_nombre": evento.auditorio.nombre if evento.auditorio else None
            }
        }), 201

    except AgendaConflictError as e:
        session.rollback()
        return jsonify({"error": str(e), "code": "CONFLICT"}), 409
    except ValidationError as e:
        session.rollback()
        return jsonify({"error": str(e), "code": "VALIDATION"}), 400
    except Exception as e:
        logger.exception("Unexpected error in POST /api/eventos/admin-direct")
        session.rollback()
        return jsonify({"error": "Error interno"}), 500
    finally:
        session.close()


@evento_bp.route('/<int:id>', methods=['PUT'])
def update_evento(id):
    service, session = get_service()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        from datetime import datetime
        nueva_fecha_inicio = None
        nueva_fecha_fin = None
        if data.get('nueva_fecha_inicio'):
            dt = datetime.fromisoformat(data['nueva_fecha_inicio'].replace('Z', ''))
            nueva_fecha_inicio = dt.replace(tzinfo=None)
        if data.get('nueva_fecha_fin'):
            dt = datetime.fromisoformat(data['nueva_fecha_fin'].replace('Z', ''))
            nueva_fecha_fin = dt.replace(tzinfo=None)

        updated_event = service.update_status(
            id,
            data.get('estado'),
            data.get('observacion'),
            data.get('motivo_rechazo'),
            None,  # admin_id — extracted from JWT in admin_required routes
            nueva_fecha_inicio=nueva_fecha_inicio,
            nueva_fecha_fin=nueva_fecha_fin,
            nueva_jornada=data.get('nueva_jornada')
        )

        if not updated_event:
            return jsonify({'error': 'Evento no encontrado'}), 404

        return jsonify({
            'success': True,
            'message': 'Evento actualizado correctamente',
            'data': {
                'id': updated_event.id,
                'estado': updated_event.estado
            }
        }), 200
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except AgendaConflictError as e:
        return jsonify({'error': str(e)}), 409
    except Exception as e:
        logger.exception("Unexpected error in PUT /api/eventos/%s", id)
        session.rollback()
        return jsonify({'error': 'Error interno al actualizar evento'}), 500
    finally:
        session.close()
