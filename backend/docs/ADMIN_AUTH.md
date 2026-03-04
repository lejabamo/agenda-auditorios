# Admin Authentication Documentation

## Overview
The system uses **JWT (JSON Web Token)** for stateless authentication.
Auth logic is located in `backend/app/auth/`.

## Endpoints

### 1. Login
**POST** `/api/auth/login`
- **Body**: `{ "email": "admin@example.com", "password": "..." }`
- **Response 200**:
  ```json
  {
      "access_token": "eyJhbG...",
      "token_type": "Bearer",
      "user": { "id": 1, "email": "..." }
  }
  ```
- **Response 401**: Invalid credentials.

### 2. Logout
**POST** `/api/auth/logout`
- **Response 200**: `{ "message": "Logged out successfully" }`
- Client should discard the token.

### 3. Protected Routes
Any route decorated with `@admin_required` expects headers:
`Authorization: Bearer <access_token>`

**Verify Admin Access:**
**GET** `/api/admin/health`
- **Response 200**: `{ "status": "admin-ok", "admin_id": 1 }`
- **Response 401/403**: Error.

## Security Implementation
- **Hashing**: `werkzeug.security`.
- **Tokens**: `HS256` signed with `JWT_SECRET_KEY` (env var).
- **Expiry**: 8 hours.
- **Location**: `backend/app/auth/jwt.py` & `decorators.py`
