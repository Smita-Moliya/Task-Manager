from django.http import JsonResponse
from django.db import connection


def get_task_assigned_to(task_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT assigned_to FROM tasks WHERE id=%s", [task_id])
        row = cur.fetchone()
    return row[0] if row else None


def ensure_task_access(request, task_id: int):
    role = getattr(request, "role", None)
    user_id = getattr(request, "user_id", None)

    assigned_to = get_task_assigned_to(task_id)

    if assigned_to is None:
        return JsonResponse({"message": "Task not found"}, status=404)

    if role not in ("ADMIN", "SUPERUSER") and int(assigned_to) != int(user_id):
        return JsonResponse({"message": "Forbidden"}, status=403)

    return None