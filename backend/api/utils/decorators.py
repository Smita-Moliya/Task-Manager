from __future__ import annotations
from functools import wraps
from typing import Callable, Iterable
import json

from django.http import JsonResponse, HttpRequest


def require_methods(methods: Iterable[str]):
    allowed = {m.upper() for m in methods}

    def decorator(view_func: Callable):
        @wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            if request.method.upper() not in allowed:
                return JsonResponse({"message": "Method not allowed"}, status=405)
            return view_func(request, *args, **kwargs)
        return wrapper

    return decorator


def require_auth(view_func: Callable):
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if not getattr(request, "user_id", None):
            return JsonResponse({"message": "Unauthorized"}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def require_admin(view_func: Callable):
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
       role = getattr(request, "role", None)
       if role not in ("ADMIN", "SUPERUSER"):
            return JsonResponse({"message": "Only admin"}, status=403)
       return view_func(request, *args, **kwargs)
    return wrapper


def require_user(view_func: Callable):
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if getattr(request, "role", None) != "USER":
            return JsonResponse({"message": "Only users"}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def parse_json_body(request: HttpRequest):
    try:
        return json.loads(request.body.decode("utf-8") or "{}"), None
    except Exception:
        return None, JsonResponse({"message": "Invalid JSON"}, status=400)


def json_required(view_func: Callable):
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        body, err = parse_json_body(request)
        if err:
            return err
        return view_func(request, *args, body=body, **kwargs)
    return wrapper

def require_superuser(view_func: Callable):
    @wraps(view_func)
    def wrapper(request: HttpRequest, *args, **kwargs):
        if getattr(request, "role", None) != "SUPERUSER":
            return JsonResponse({"message": "Only superuser"}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


def require_permission(permission_code: str):
    def decorator(view_func: Callable):
        @wraps(view_func)
        def wrapper(request: HttpRequest, *args, **kwargs):
            from api.services.permission_service import has_permission

            user = getattr(request, "user", None)
            if not user:
                return JsonResponse({"message": "Unauthorized"}, status=401)

            if not has_permission(user, permission_code):
                return JsonResponse({"message": "Forbidden"}, status=403)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator