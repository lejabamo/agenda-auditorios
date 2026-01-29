from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.dependencia_service import DependenciaService

dependencia_bp = Blueprint('dependencias', __name__, url_prefix='/api/dependencias')

def get_service():
    session = SessionLocal()
    return DependenciaService(session), session

@dependencia_bp.route('/', methods=['POST'])
def create_dependencia():
    service, session = get_service()
    try:
        data = request.get_json()
        if not data or 'nombre' not in data or 'tipo' not in data:
            return jsonify({'error': 'Nombre y Tipo son obligatorios'}), 400
        
        nueva = service.create(data)
        return jsonify({
            'id': nueva.id,
            'nombre': nueva.nombre,
            'tipo': nueva.tipo,
            'sigla': nueva.sigla,
            'activa': nueva.activa
        }), 201
    finally:
        session.close()

@dependencia_bp.route('/', methods=['GET'])
def list_dependencias():
    service, session = get_service()
    try:
        dependencias = service.get_all()
        return jsonify([
            {
                'id': d.id,
                'nombre': d.nombre,
                'tipo': d.tipo,
                'sigla': d.sigla,
                'activa': d.activa
            } for d in dependencias
        ]), 200
    finally:
        session.close()

@dependencia_bp.route('/<int:id>', methods=['GET'])
def get_dependencia(id):
    service, session = get_service()
    try:
        dependencia = service.get_by_id(id)
        if not dependencia:
            return jsonify({'error': 'Dependencia no encontrada'}), 404
        
        return jsonify({
            'id': dependencia.id,
            'nombre': dependencia.nombre,
            'tipo': dependencia.tipo,
            'sigla': dependencia.sigla,
            'activa': dependencia.activa
        }), 200
    finally:
        session.close()

@dependencia_bp.route('/<int:id>', methods=['PUT'])
def update_dependencia(id):
    service, session = get_service()
    try:
        data = request.get_json()
        dependencia = service.update(id, data)
        if not dependencia:
            return jsonify({'error': 'Dependencia no encontrada'}), 404
        
        return jsonify({
            'id': dependencia.id,
            'nombre': dependencia.nombre,
            'tipo': dependencia.tipo,
            'sigla': dependencia.sigla,
            'activa': dependencia.activa
        }), 200
    finally:
        session.close()

@dependencia_bp.route('/<int:id>', methods=['DELETE'])
def delete_dependencia(id):
    service, session = get_service()
    try:
        success = service.delete(id)
        if not success:
            return jsonify({'error': 'Dependencia no encontrada'}), 404
        
        return jsonify({'message': 'Dependencia desactivada correctamente'}), 200
    finally:
        session.close()
