from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.auditorio_service import AuditorioService

auditorio_bp = Blueprint('auditorios', __name__, url_prefix='/api/auditorios')

def get_service():
    session = SessionLocal()
    return AuditorioService(session), session

@auditorio_bp.route('/', methods=['POST'])
def create_auditorio():
    service, session = get_service()
    try:
        data = request.get_json()
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Nombre es obligatorio'}), 400
        
        nuevo = service.create(data)
        return jsonify({
            'id': nuevo.id,
            'nombre': nuevo.nombre,
            'ubicacion': nuevo.ubicacion,
            'capacidad': nuevo.capacidad,
            'descripcion': nuevo.descripcion,
            'activo': nuevo.activo
        }), 201
    finally:
        session.close()

@auditorio_bp.route('/', methods=['GET'])
def list_auditorios():
    service, session = get_service()
    try:
        auditorios = service.get_all()
        return jsonify([
            {
                'id': a.id,
                'nombre': a.nombre,
                'ubicacion': a.ubicacion,
                'capacidad': a.capacidad,
                'activo': a.activo
            } for a in auditorios
        ]), 200
    finally:
        session.close()

@auditorio_bp.route('/<int:id>', methods=['GET'])
def get_auditorio(id):
    service, session = get_service()
    try:
        auditorio = service.get_by_id(id)
        if not auditorio:
            return jsonify({'error': 'Auditorio no encontrado'}), 404
        
        return jsonify({
            'id': auditorio.id,
            'nombre': auditorio.nombre,
            'ubicacion': auditorio.ubicacion,
            'capacidad': auditorio.capacidad,
            'descripcion': auditorio.descripcion,
            'activo': auditorio.activo
        }), 200
    finally:
        session.close()

@auditorio_bp.route('/<int:id>', methods=['PUT'])
def update_auditorio(id):
    service, session = get_service()
    try:
        data = request.get_json()
        auditorio = service.update(id, data)
        if not auditorio:
            return jsonify({'error': 'Auditorio no encontrado'}), 404
        
        return jsonify({
            'id': auditorio.id,
            'nombre': auditorio.nombre,
            'ubicacion': auditorio.ubicacion,
            'capacidad': auditorio.capacidad,
            'activo': auditorio.activo
        }), 200
    finally:
        session.close()

@auditorio_bp.route('/<int:id>', methods=['DELETE'])
def delete_auditorio(id):
    service, session = get_service()
    try:
        success = service.delete(id)
        if not success:
            return jsonify({'error': 'Auditorio no encontrado'}), 404
        
        return jsonify({'message': 'Auditorio desactivado correctamente'}), 200
    finally:
        session.close()
