import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

def test_happy_path_create_evento(test_client, db_session):
    """
    Test generating a valid request > 48h in advance.
    """
    # 1. Arrange
    # Determine a valid auditorio ID (assuming 1 exists or mocked)
    # Since we can't rely on existing data, let's assume seed data exists or we mock the service.
    # However, for integration test, we use real DB with rollback.
    
    # Ensure a date that is surely empty in the DB (e.g. year 2027)
    # But still > 48h from now to satisfy business rules.
    fecha_inicio = datetime(2027, 4, 15, 10, 0, 0)
    fecha_fin = fecha_inicio + timedelta(hours=2)
    
    payload = {
        "titulo": "Evento de Prueba Happy Path",
        "fecha_inicio": fecha_inicio.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1, 
        "dependencia_id": 1,
        "responsable_nombre": "Tester",
        "responsable_telefono": "3001234567",
        "correo_confirmacion": "test@example.com",
        "aforo_estimado": 10,
        "dry_run": False
    }

    # 2. Act
    # We patch the service to use our test session if needed, 
    # but the route creates its own session using get_service(). 
    # To truly use the rollback session, we might need to patch 'app.routes.evento_routes.get_service'.
    
    with patch('app.routes.evento_routes.get_service', return_value=(None, db_session)) as mock_get_service:
        # We need to construct the service manually with the mock session
        from app.services.evento_service import EventoService
        service = EventoService(db_session)
        mock_get_service.return_value = (service, db_session)
        
        response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 201
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["titulo"] == payload["titulo"]



def test_invalid_email_phone(test_client, db_session):
    """
    Test data validation for email and phone.
    """
    # 1. Arrange
    fecha_inicio = datetime.now() + timedelta(hours=72)
    fecha_fin = fecha_inicio + timedelta(hours=2)

    payload = {
        "titulo": "Evento Data Mala",
        "fecha_inicio": fecha_inicio.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1,
        "dependencia_id": 1,
        "responsable_nombre": "Tester",
        "responsable_telefono": "123", # Invalid
        "correo_confirmacion": "not-an-email", # Invalid
    }

    # 2. Act
    with patch('app.routes.evento_routes.get_service') as mock_get_service:
        from app.services.evento_service import EventoService
        service = EventoService(db_session)
        mock_get_service.return_value = (service, db_session)

        response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 400
    data = response.get_json()
    # Can match generic or specific message
    assert "formato" in str(data).lower() or "teléfono" in str(data).lower()
