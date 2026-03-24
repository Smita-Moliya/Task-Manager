import bcrypt
from datetime import datetime, timedelta, timezone as dt_timezone

from django.conf import settings
from rest_framework.exceptions import NotFound, PermissionDenied

from api.db import users_db
from api.exceptions import BadRequestError, ConflictError
from api.services.permission_service import has_permission
from api.utils.mailer import send_set_password_email
from api.utils.token_utils import create_invite_token_raw, hash_token


def create_user_service(data):
    name = data["name"]
    email = data["email"]
    role = data["role"]

    if users_db.user_exists_by_email(email):
        raise ConflictError({"message": "User already exists.", "email": email})

    raw_token = create_invite_token_raw()
    token_hash = hash_token(raw_token)

    user_id = users_db.create_user_returning_id(name, email, role)
    users_db.insert_password_invite(user_id, token_hash)

    send_set_password_email(email, raw_token)

    return {
        "message": "User created. Password setup link sent!",
        "user_id": user_id,
    }


def list_users_service(params):
    page = _safe_int(params.get("page"), 1)
    page_size = _safe_int(params.get("page_size"), 10)
    role = (params.get("role") or "").strip().upper() or None

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100

    if role not in (None, "USER", "ADMIN", "SUPERUSER"):
        raise BadRequestError("Invalid role filter")

    offset = (page - 1) * page_size
    total = users_db.users_count(role=role)
    rows = users_db.list_users_page(page_size, offset, role=role)

    items = [
        {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    if page > total_pages:
        page = total_pages

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "role_filter": role,
    }


def send_reset_link_service(data):
    email = data["email"]

    user_id = users_db.get_user_id_by_email(email)
    if not user_id:
        raise NotFound("User not found")

    users_db.mark_active_invites_used(user_id)

    raw_token = create_invite_token_raw()
    token_hash = hash_token(raw_token)

    users_db.insert_password_invite(user_id, token_hash)
    send_set_password_email(email, raw_token)

    return {"message": "Password setup link sent !"}


def set_password_from_token_service(data):
    raw_token = data["token"]
    password = data["password"]

    token_hash = hash_token(raw_token)
    exp_minutes = getattr(settings, "RESET_TOKEN_EXP_MINUTES", 60)

    row = users_db.get_invite_by_token(token_hash)
    if not row:
        raise BadRequestError("Invalid or already used link")

    invite_id, user_id, is_used, created_at = row

    if is_used:
        raise BadRequestError("Link already used. Please login.")

    created_at_utc = created_at.replace(tzinfo=dt_timezone.utc)
    expires_at = created_at_utc + timedelta(minutes=exp_minutes)

    if datetime.now(dt_timezone.utc) > expires_at:
        raise BadRequestError("Link expired. Ask admin to resend link.")

    pw_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    users_db.update_user_password_hash(user_id, pw_hash)
    users_db.mark_invite_used(invite_id)

    return {"message": "Password set successfully! Please login."}


def delete_user_service(current_user, current_user_id, target_user_id):
    if not has_permission(current_user, "delete_user"):
        raise PermissionDenied("Forbidden")

    if current_user_id == target_user_id:
        raise BadRequestError("Admin cannot delete self")

    if not users_db.user_exists_by_id(target_user_id):
        raise NotFound("User not found")

    if users_db.user_has_assigned_tasks(target_user_id):
        raise BadRequestError(
            "Cannot delete user because tasks are assigned to this user. Please delete the tasks first."
        )

    users_db.delete_user_by_id(target_user_id)

    return {"message": "User deleted successfully"}


def update_user_service(current_user, current_user_id, target_user_id, data):
    if not has_permission(current_user, "edit_user"):
        raise PermissionDenied("Forbidden")

    name = data["name"].strip()
    email = data["email"].strip().lower()
    role = data["role"].strip().upper()

    existing = users_db.get_user_by_id(target_user_id)
    if not existing:
        raise NotFound("User not found")

    email_owner = users_db.get_user_by_email(email)
    if email_owner and int(email_owner["id"]) != int(target_user_id):
        raise BadRequestError("Email already exists.")

    if current_user_id == target_user_id:
        safe_role = existing["role"]
    elif existing["role"] == "ADMIN":
        safe_role = existing["role"]
    else:
        safe_role = role

    updated = users_db.update_user(
        user_id=target_user_id,
        name=name,
        email=email,
        role=safe_role,
    )

    if not updated:
        raise BadRequestError("Failed to update user")

    return {
        "message": "User updated ✅",
        "user": updated,
    }


def get_user_by_id_service(user_id):
    user = users_db.get_user_by_id(user_id)
    if not user:
        raise NotFound("User not found")
    return user


def _safe_int(value, default):
    try:
        return int(value)
    except Exception:
        return default