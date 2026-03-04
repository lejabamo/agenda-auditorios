import pytest

def test_login_cors_preflight(test_client):
    """
    Test OPTIONS /api/auth/login to ensure CORS headers are present.
    """
    response = test_client.options('/api/auth/login', headers={
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
    })
    
    print(f"Status: {response.status_code}")
    print(f"Headers: {response.headers}")
    
    assert response.status_code == 200, f"Preflight rejected: {response.status_code}"
    assert 'Access-Control-Allow-Origin' in response.headers, "Missing CORS Origin header"
    assert response.headers['Access-Control-Allow-Origin'] == 'http://localhost:5173', "Incorrect CORS Origin"
    assert 'Access-Control-Allow-Methods' in response.headers, "Missing CORS Methods header"
