"""Auth helpers: password hashing + JWT (PBKDF2 — tránh lỗi passlib/bcrypt mới)."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

SECRET_KEY = "secureface-dev-secret-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12
DEFAULT_PIN = "1234"


def _pbkdf2(secret: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", secret.encode("utf-8"), salt.encode("utf-8"), 120_000
    ).hex()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"pbkdf2${salt}${_pbkdf2(password, salt)}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        algo, salt, digest = hashed.split("$", 2)
        if algo != "pbkdf2":
            return False
        return hmac.compare_digest(_pbkdf2(plain, salt), digest)
    except Exception:
        return False


def hash_pin(pin: str) -> str:
    return hash_password(pin)


def verify_pin(plain: str, hashed: str | None) -> bool:
    if not hashed:
        return plain == DEFAULT_PIN
    return verify_password(plain, hashed)


def create_access_token(data: dict, expires_hours: int = ACCESS_TOKEN_EXPIRE_HOURS) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
