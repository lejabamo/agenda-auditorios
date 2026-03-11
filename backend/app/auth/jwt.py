import jwt
import datetime
import os
import logging

logger = logging.getLogger(__name__)

# JWT secret MUST be set via environment variable in production
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    import sys
    if "pytest" not in sys.modules:
        logger.warning(
            "JWT_SECRET_KEY not set. Using insecure default — set this env var before deploying."
        )
    JWT_SECRET_KEY = "dev-secret-key-change-me"

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8


def generate_token(admin_id):
    """Generate a signed JWT token for the given admin ID."""
    payload = {
        "sub": str(admin_id),
        "role": "ADMIN",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def generate_recovery_token(admin_id):
    """Generate a signed JWT token for password recovery (expires in 1 hour)."""
    payload = {
        "sub": str(admin_id),
        "role": "RECOVERY",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token):
    """Decode and verify a JWT token. Returns payload dict or None on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.info("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid JWT token: %s", e)
        return None
