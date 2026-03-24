import bcrypt
import jwt
from django.conf import settings

from api.db import auth_db
from api.utils.jwt_tokens import make_access, make_refresh
from api.utils.token_utils import hash_token
from api.services.permission_service import get_effective_permissions, get_allowed_pages


def login_service(email, password):
    row = auth_db.get_user_by_email(email)
    if not row:
        return 401, {"message": "Invalid email or password"}

    user_id, name, email_db, pw_hash, role = row

    if not pw_hash:
        return 403, {
            "message": "Password not set yet. Please use the password setup link sent to your email."
        }

    if not bcrypt.checkpw(password.encode("utf-8"), pw_hash.encode("utf-8")):
        return 401, {"message": "Invalid email or password"}

    access = make_access(user_id, role)
    refresh = make_refresh(user_id, role)

    user = {"id": user_id, "name": name, "email": email_db, "role": role}
    permissions = get_effective_permissions(user_id, role)
    pages = get_allowed_pages(user)

    return 200, {
        "access": access,
        "refresh": refresh,
        "user": user,
        "permissions": permissions,
        "pages": pages,
    }

def refresh_access_service(refresh_token):
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])

        if payload.get("type") != "refresh":
            return 401, {"message": "Invalid refresh token"}

        user_id = payload.get("user_id")
        role = payload.get("role")

        if not auth_db.user_exists(int(user_id)):
            return 401, {"message": "User not found"}

        new_access = make_access(user_id, role)
        return 200, {"access": new_access}

    except jwt.ExpiredSignatureError:
        return 401, {"message": "Refresh token expired"}
    except Exception:
        return 401, {"message": "Invalid refresh token"}


def logout_service(refresh_raw):
    refresh_hash = hash_token(refresh_raw)
    auth_db.revoke_refresh_token(refresh_hash)
    return 200, {"message": "Logged out"}
