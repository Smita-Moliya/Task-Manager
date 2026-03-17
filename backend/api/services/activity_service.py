from typing import Any, Dict, List
from api.db import activity_db


def get_admin_activity_payload(filters: Dict[str, Any]) -> Dict[str, Any]:
    page = filters["page"]
    page_size = filters["page_size"]
    q = filters.get("q", "")
    task_id = filters.get("task_id")
    actor_id = filters.get("actor_id")
    action = filters.get("action", "")

    total = activity_db.admin_activity_count(task_id, actor_id, action, q)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size

    rows = activity_db.admin_activity_list(task_id, actor_id, action, q, page_size, offset)

    results: List[Dict[str, Any]] = []
    for r in rows:
        meta = r[7] or {}
        results.append(
            {
                "id": r[0],
                "task_id": r[1],
                "task_title": r[2] or "",
                "actor_id": r[3],
                "actor_name": r[4] or "Unknown",
                "action": r[5],
                "message": r[6] or "",
                "meta": meta,
                "created_at": r[8].isoformat() if r[8] else None,
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


def get_admin_activity_payload(filters: Dict[str, Any]) -> Dict[str, Any]:
    page = filters["page"]
    page_size = filters["page_size"]
    q = filters.get("q", "")
    task_id = filters.get("task_id")
    actor_id = filters.get("actor_id")
    action = filters.get("action", "")

    total = activity_db.admin_activity_count(task_id, actor_id, action, q)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size

    rows = activity_db.admin_activity_list(task_id, actor_id, action, q, page_size, offset)

    results: List[Dict[str, Any]] = []
    for r in rows:
        meta = r[7] or {}
        results.append(
            {
                "id": r[0],
                "task_id": r[1],
                "task_title": r[2] or "",
                "actor_id": r[3],
                "actor_name": r[4] or "Unknown",
                "action": r[5],
                "message": r[6] or "",
                "meta": meta,
                "created_at": r[8].isoformat() if r[8] else None,
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
    for r in rows:
        meta = r[7] or {}
        activities.append(
            {
                "id": r[0],
                "task_id": r[1],
                "task_title": r[2] or "",
                "actor_id": r[3],
                "actor_name": r[4] or "Unknown",
                "action": r[5],
                "message": r[6] or "",
                "meta": meta,
                "created_at": r[8].isoformat() if r[8] else None,
            }
        )

    return {"activities": activities}