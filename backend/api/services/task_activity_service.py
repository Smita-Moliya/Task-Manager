from typing import Any, Dict, List

from rest_framework.exceptions import PermissionDenied

from api.db import activity_db


def get_task_activity_payload(task_id: int, filters: Dict[str, Any]) -> Dict[str, Any]:
    page = filters["page"]
    page_size = filters["page_size"]
    q = filters.get("q", "")
    actor_id = filters.get("actor_id")
    action = filters.get("action", "")

    total = activity_db.admin_activity_count(task_id, actor_id, action, q)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size
    rows = activity_db.admin_activity_list(task_id, actor_id, action, q, page_size, offset)

    results: List[Dict[str, Any]] = []
    for row in rows:
        meta = row[7] or {}
        results.append(
            {
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
        )

    return {
        "results": results,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
    }


def get_my_activity_payload(user_id: int) -> Dict[str, Any]:
    rows = activity_db.user_activity_list(user_id, 10)

    activities: List[Dict[str, Any]] = []
    for row in rows:
        meta = row[7] or {}
        activities.append(
            {
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
        )

    return {"activities": activities}


def get_task_activity_service(role: str, filters: Dict[str, Any], task_id: int) -> Dict[str, Any]:
    if role != "ADMIN":
        raise PermissionDenied("Forbidden")
    return get_task_activity_payload(task_id, filters)


def get_my_activity_service(user_id: int) -> Dict[str, Any]:
    return get_my_activity_payload(user_id)