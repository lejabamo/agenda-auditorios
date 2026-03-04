import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
from app.models.evento import Evento
from app.models.bloqueo_auditorio import BloqueoAuditorio

def test_admin_block_rejection(test_client, db_session):
    """
    Test rejection if an administrative block exists.
    """
    # 1. Arrange
    # Create the block in the DB (rolled back after test)
    block_start = datetime.now() + timedelta(days=5)
    block_end = block_start + timedelta(days=1)
    
    bloqueo = BloqueoAuditorio(
        auditorio_id=1,
        fecha_inicio=block_start,
        fecha_fin=block_end,
        motivo="Mantenimiento",
        activo=True
    )
    db_session.add(bloqueo)
    db_session.flush() # Persist to DB for this transaction

    # Request overlaps with block
    req_start = block_start + timedelta(hours=2)
    req_end = req_start + timedelta(hours=2)
    
    payload = {
        "titulo": "Evento Bloqueado",
        "fecha_inicio": req_start.isoformat(),
        "fecha_fin": req_end.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1,
        "dependencia_id": 1,
        "responsable_nombre": "Blocked User",
        "responsable_telefono": "3001234567",
        "correo_confirmacion": "test@example.com",
    }

    # 2. Act
    with patch('app.routes.evento_routes.get_service') as mock_get_service:
        from app.services.evento_service import EventoService
        service = EventoService(db_session)
        mock_get_service.return_value = (service, db_session)

        response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 409 # Conflict
    data = response.get_json()
    assert "bloqueo administrativo" in data["message"]

def test_overlap_rejection(test_client, db_session):
    """
    Test rejection if another event is already approved/pending.
    """
    # 1. Arrange
    event_start = datetime.now() + timedelta(days=10)
    event_end = event_start + timedelta(hours=4)
    
    # Create existing event
    evento_existente = Evento(
        titulo="Evento Existente",
        fecha_inicio=event_start,
        fecha_fin=event_end,
        jornada="MAÑANA",
        auditorio_id=1,
        dependencia_id=1,
        responsable_nombre="Existing User",
        responsable_telefono="3001234567",
        correo_confirmacion="existing@example.com",
        estado="APROBADO"
    )
    db_session.add(evento_existente)
    db_session.flush()

    # Create overlapping request (starts 1 hour after existing starts)
    req_start = event_start + timedelta(hours=1)
    req_end = req_start + timedelta(hours=2)
    
    payload = {
        "titulo": "Evento Solapado",
        "fecha_inicio": req_start.isoformat(),
        "fecha_fin": req_end.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1,
        "dependencia_id": 1,
        "responsable_nombre": "Overlap User",
        "responsable_telefono": "3001234567",
        "correo_confirmacion": "test@example.com",
    }

    # 2. Act
    with patch('app.routes.evento_routes.get_service') as mock_get_service:
        from app.services.evento_service import EventoService
        service = EventoService(db_session)
        mock_get_service.return_value = (service, db_session)

        response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 409 # Conflict
    data = response.get_json()
    assert "disponible" in data["message"]
