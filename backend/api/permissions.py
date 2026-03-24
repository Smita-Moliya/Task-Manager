from rest_framework.permissions import BasePermission

from api.services.permission_service import has_permission


def _get_role(request):
    if getattr(request, "role", None):
        return request.role

    user = getattr(request, "user", None)
    if isinstance(user, dict):
        return user.get("role")

    return None


def _get_user(request):
    user = getattr(request, "user", None)
    if isinstance(user, dict) and user:
        return user
    return None


class IsAuthenticatedCustom(BasePermission):
    message = "Unauthorized"

    def has_permission(self, request, view):
        return bool(
            getattr(request, "user_id", None)
            or _get_user(request)
        )


class IsAdminUserCustom(BasePermission):
    message = "Only admin"

    def has_permission(self, request, view):
        return _get_role(request) == "ADMIN"


class IsSuperUserCustom(BasePermission):
    message = "Only superuser"

    def has_permission(self, request, view):
        return _get_role(request) == "SUPERUSER"


class IsRegularUserCustom(BasePermission):
    message = "Only users"

    def has_permission(self, request, view):
        return _get_role(request) == "USER"


class IsAdminOrSuperUserCustom(BasePermission):
    message = "Only admin or superuser"

    def has_permission(self, request, view):
        return _get_role(request) in ("ADMIN", "SUPERUSER")


class HasViewPermission(BasePermission):
    message = "Forbidden"

    def has_permission(self, request, view):
        user = _get_user(request)
        if not user:
            self.message = "Unauthorized"
            return False

        permission_code = getattr(view, "permission_code", None)
        if not permission_code:
            self.message = "Permission code not configured"
            return False

        return has_permission(user, permission_code)