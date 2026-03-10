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

def test_min_24h_notice_rule(test_client, db_session):
    """
    Test rejection if request is < 24h from now.
    """
    # 1. Arrange
    fecha_inicio = datetime.now() + timedelta(hours=23) # Violated rule
    fecha_fin = fecha_inicio + timedelta(hours=2)

    payload = {
        "titulo": "Evento Prisa",
        "fecha_inicio": fecha_inicio.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1,
        "dependencia_id": 1,
        "responsable_nombre": "Late Tester",
        "responsable_telefono": "3001234567",
        "correo_confirmacion": "test@example.com",
    }

    # 2. Act
    with patch('app.routes.evento_routes.get_service', return_value=(None, db_session)) as mock_get_service:
        from app.services.evento_service import EventoService
        service = EventoService(db_session)
        mock_get_service.return_value = (service, db_session)

        response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 400
    data = response.get_json()
    assert "24 horas" in data["message"]

def test_agenda_closure_rule_5pm(test_client, db_session):
    """
    Test rejection if requesting for Tomorrow when Now >= 17:00.
    """
    # 1. Arrange
    # Mock time to be 17:05 today
    today_5pm = datetime.now().replace(hour=17, minute=5, second=0)
    
    tomorrow_start = (today_5pm + timedelta(days=1)).replace(hour=8, minute=0)
    tomorrow_end = tomorrow_start + timedelta(hours=2)

    payload = {
        "titulo": "Evento Post Cierre",
        "fecha_inicio": tomorrow_start.isoformat(),
        "fecha_fin": tomorrow_end.isoformat(),
        "jornada": "MAÑANA",
        "auditorio_id": 1,
        "dependencia_id": 1,
        "responsable_nombre": "After Hours",
        "responsable_telefono": "3001234567",
        "correo_confirmacion": "test@example.com",
    }

    # 2. Act
    # Patch datetime in the SERVICE module
    with patch('app.routes.evento_routes.get_service') as mock_get_service:
        with patch('app.services.evento_service.datetime') as mock_datetime:
            mock_datetime.now.return_value = today_5pm
            mock_datetime.fromisoformat = datetime.fromisoformat # Keep original method
            
            # Setup service and session
            from app.services.evento_service import EventoService
            service = EventoService(db_session)
            mock_get_service.return_value = (service, db_session)

            response = test_client.post('/api/eventos/', json=payload)

    # 3. Assert
    assert response.status_code == 400
    data = response.get_json()
    assert "cerrada" in str(data)

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
