import json
from typing import Any, Dict, Tuple

from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from api.db import google_auth_db
from api.utils.jwt_tokens import make_access, make_refresh


def google_auth_service(raw_body: bytes) -> Tuple[int, Dict[str, Any]]:
    # JSON parse (same errors)
    try:
        body = json.loads(raw_body.decode("utf-8"))
    except Exception:
        return 400, {"message": "Invalid JSON"}

    credential = body.get("credential")
    if not credential:
        return 400, {"message": "Missing credential"}

    # verify google token
    try:
        info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        return 401, {"message": "Invalid Google token"}

    email = info.get("email")
    name = (info.get("name") or "").strip()

    if not email:
        return 400, {"message": "Google account has no email"}

    # find/create user
    row = google_auth_db.get_user_basic_by_email(email)
    if row:
        user_id, db_name, db_email, role = row
        if not name:
            name = db_name
        # keep response email as the google email (same as your code)
    else:
        role = "USER"
        if not name:
            name = email.split("@")[0]
        user_id = google_auth_db.create_google_user(name, email, role)

    # issue tokens (same response structure)
    access = make_access(user_id=user_id, role=role)
    refresh = make_refresh(user_id=user_id, role=role)

    return 200, {
        "access": access,
        "refresh": refresh,
        "user": {"id": user_id, "name": name, "email": email, "role": role},
    }