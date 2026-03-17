import secrets
import hashlib

def create_invite_token_raw() -> str:
    return secrets.token_urlsafe(48)

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()