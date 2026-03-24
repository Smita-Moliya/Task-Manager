from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.db.access_control_db import (
    fetch_role_page_access,
    fetch_page_access_for_role,
    replace_role_page_access,
    has_page_access,
)
from api.serializers.access_control_serializer import UpdateRolePageAccessSerializer
from api.utils.decorators import require_auth, require_methods


PAGE_LABELS = {
    "admin.dashboard": {
        "label": "Dashboard",
        "description": "Overview of admin stats, performance, and summary cards.",
    },
    "admin.users": {
        "label": "Users",
        "description": "Manage users, roles, invitations, and account details.",
    },
    "admin.projects": {
        "label": "Projects",
        "description": "Create, view, and manage projects and assignments.",
    },
    "admin.tasks": {
        "label": "Tasks",
        "description": "Create, assign, and monitor all tasks across the system.",
    },
    "admin.analytics": {
        "label": "Analytics",
        "description": "Access project insights, charts, and performance reports.",
    },
    "admin.activity": {
        "label": "Activity",
        "description": "View recent activity logs and system updates.",
    },
    # "admin.comments": {
    #     "label": "Comments",
    #     "description": "View and manage comments made across tasks and projects.",
    # },
    # "admin.attachments": {
    #     "label": "Attachments",
    #     "description": "View and manage uploaded files and task attachments.",
    # },
    "user.tasks": {
        "label": "My Tasks",
        "description": "View and manage tasks assigned to the logged-in user.",
    },
    "user.projects": {
        "label": "My Projects",
        "description": "See projects that the logged-in user is part of.",
    },
    "user.activity": {
        "label": "My Activity",
        "description": "Track personal task and project activity history.",
    },
    "user.comments": {
        "label": "Comments",
        "description": "Access discussion threads and task-related comments.",
    },
    "user.attachments": {
        "label": "Attachments",
        "description": "Access uploaded files related to accessible work items.",
    },
    "user.insights": {
        "label": "Insights",
        "description": "View personal productivity and task progress insights.",
    },
}


def _format_role_payload(role: str, items: list[dict]):
    pages = []
    for item in items:
        page_key = item["page_key"]
        meta = PAGE_LABELS.get(page_key, {})
        pages.append({
            "page_key": page_key,
            "label": meta.get("label", page_key),
            "description": meta.get("description", ""),
            "allowed": bool(item["allowed"]),
        })
    return {"role": role, "pages": pages}


def _get_user_role(request) -> str:
    user = getattr(request, "user", None)
    if not user:
        return ""

    if isinstance(user, dict):
        return str(user.get("role", "")).upper()

    return str(getattr(user, "role", "")).upper()


def is_super_admin(request) -> bool:
    role = _get_user_role(request)
    return role == "SUPERUSER"


def ensure_super_admin(request) -> bool:
    return is_super_admin(request)


def user_has_page_access(request, page_key: str) -> bool:
    role = _get_user_role(request)

    if role == "SUPERUSER":
        return True

    return has_page_access(role, page_key)


@csrf_exempt
@require_methods(["GET", "PUT"])
@require_auth
def access_control_view(request):
    print("ACCESS CONTROL request.user =", getattr(request, "user", None))
    print("ACCESS CONTROL role =", _get_user_role(request))

    if not ensure_super_admin(request):
        return JsonResponse({"message": "Forbidden"}, status=403)

    if request.method == "GET":
        data = fetch_role_page_access()
        response = {
            "roles": [
                _format_role_payload("ADMIN", data.get("ADMIN", [])),
                _format_role_payload("USER", data.get("USER", [])),
            ]
        }
        return JsonResponse(response, status=200)

    serializer = UpdateRolePageAccessSerializer(
        data=request.json if hasattr(request, "json") else None
    )

    if not serializer.initial_data:
        import json
        try:
            payload = json.loads(request.body.decode("utf-8"))
        except Exception:
            return JsonResponse({"message": "Invalid JSON body."}, status=400)
        serializer = UpdateRolePageAccessSerializer(data=payload)

    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation failed.", "errors": serializer.errors},
            status=400
        )

    role = serializer.validated_data["role"]
    pages = serializer.validated_data["pages"]

    replace_role_page_access(role, pages)

    updated = fetch_page_access_for_role(role)
    return JsonResponse(
        {
            "message": f"{role} access updated successfully.",
            "role": _format_role_payload(role, updated),
        },
        status=200
    )