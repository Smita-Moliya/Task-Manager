from typing import Any, Dict, List
from rest_framework.exceptions import PermissionDenied

from api.db import activity_db


def _serialize_activity_row(row) -> Dict[str, Any]:
    meta = row[7] or {}

    return {
        "id": row[0],
        "task_id": row[1],
        "task_title": row[2] or "",
        "actor_id": row[3],
        "actor_name": row[4] or "Unknown",
        "action": row[5],
        "message": row[6] or "",
        "meta": meta,
        "created_at": row[8].isoformat() if row[8] else None,
    }


def get_admin_activity_service(*, request, filters: Dict[str, Any]) -> Dict[str, Any]:
    if request.role not in ("ADMIN", "SUPERUSER"):
        raise PermissionDenied("Forbidden")

    page = filters["page"]
    page_size = filters["page_size"]
    q = filters.get("q", "")
    task_id = filters.get("task_id")
    actor_id = filters.get("actor_id")
    action = filters.get("action", "")

    total = activity_db.admin_activity_count(
        task_id=task_id,
        actor_id=actor_id,
        action=action,
        q=q,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size

    rows = activity_db.admin_activity_list(
        task_id=task_id,
        actor_id=actor_id,
        action=action,
        q=q,
        limit=page_size,
        offset=offset,
    )

    results: List[Dict[str, Any]] = [_serialize_activity_row(row) for row in rows]

    return {
        "results": results,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
    }


def get_my_activity_service(*, user_id: int, limit: int = 10) -> Dict[str, Any]:
    rows = activity_db.user_activity_list(user_id=user_id, limit=limit)

    activities: List[Dict[str, Any]] = [_serialize_activity_row(row) for row in rows]

    return {
        "activities": activities
    }