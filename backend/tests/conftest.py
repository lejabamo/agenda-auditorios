import pytest
import sys
import os
from datetime import datetime, timedelta

# Add the backend path to sys.path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db import SessionLocal, engine, Base
from app import create_app
from app.models.auditorio import Auditorio
from app.models.evento import Evento
from app.models.bloqueo_auditorio import BloqueoAuditorio

@pytest.fixture(scope="session")
def test_app():
    """Create a Flask app instance for testing."""
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    return app

@pytest.fixture(scope="session")
def test_client(test_app):
    """Create a Flask test client."""
    return test_app.test_client()

@pytest.fixture(scope="function")
def db_session():
    """
    Creates a new database session for a test.
    Rolls back any changes at the end of the test.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
