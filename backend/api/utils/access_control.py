from api.db.access_control_db import has_page_access


def is_super_admin(request) -> bool:
    user = getattr(request, "user", None)
    if not user:
        return False

    role = str(user.get("role", "")).upper()
    return role == "SUPER_ADMIN"


def ensure_super_admin(request):
    return is_super_admin(request)


def user_has_page_access(request, page_key: str) -> bool:
    user = getattr(request, "user", None)
    if not user:
        return False

    role = str(user.get("role", "")).upper()
    return has_page_access(role, page_key)