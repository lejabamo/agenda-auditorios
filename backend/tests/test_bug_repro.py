import pytest

def test_get_auditorios_crash(test_client, db_session):
    """
    Test GET /api/auditorios/ to check for 500 errors.
    """
    response = test_client.get('/api/auditorios/')
    assert response.status_code == 200, f"GET /api/auditorios/ crashed: {response.status_code} - {response.text}"

def test_get_eventos_crash(test_client, db_session):
    """
    Test GET /api/eventos/ with empty query params to simulate frontend.
    """
    response = test_client.get('/api/eventos/?auditorio_id=&fecha=&estado=')
    assert response.status_code == 200, f"GET /api/eventos/ crashed with params: {response.status_code} - {response.text}"

def test_get_eventos_bad_input(test_client, db_session):
    """
    Test GET /api/eventos/ with 'undefined' query params to simulate frontend bugs.
    """
    # Case 1: auditorio_id="undefined"
    response = test_client.get('/api/eventos/?auditorio_id=undefined')
    # Use 500 to ASSERT it fails (reproducing the bug)
    # If it returns 200/400, then this is NOT the issue.
    # We want to confirm if this causes 500.
    if response.status_code == 500:
        print("Reproduced 500 error with auditorio_id=undefined")
    assert response.status_code != 500, "CRASH: auditorio_id=undefined caused 500"

    # Case 2: fecha="undefined"
    response = test_client.get('/api/eventos/?fecha=undefined')
    if response.status_code == 500:
        print("Reproduced 500 error with fecha=undefined")
    assert response.status_code != 500, "CRASH: fecha=undefined caused 500"

