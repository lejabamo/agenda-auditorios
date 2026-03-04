import pytest
from app.auth.jwt import generate_token

def test_login_post_crash(test_client, db_session):
    """
    Test POST /api/auth/login to ensure it returns 200/401 and not 500.
    """
    # 1. Create a user (or ensure one exists) - mocking DB interactions if needed
    # Ideally we use the create-admin CLI or seed, but here we can just try to login 
    # with random creds. Even if 401, it proves NO CRASH.
    
    payload = {
        "email": "test_crash@example.com",
        "password": "randompassword"
    }
    
    response = test_client.post('/api/auth/login', json=payload)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # We expect 401 (invalid) or 200 (valid), NOT 500
    assert response.status_code != 500, f"Login CRASHED with 500: {response.text}"
    assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"
