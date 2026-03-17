from typing import Any, Dict, List
from api.db import task_activity_db


def get_task_activity_payload(task_id: int, query_params) -> Dict[str, Any]:
    try:
        page = int(query_params.get("page", "1"))
    except Exception:
        page = 1

    try:
        page_size = int(query_params.get("page_size", "20"))
    except Exception:
        page_size = 20

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    if page_size > 100:
        page_size = 100

    offset = (page - 1) * page_size

    if not task_activity_db.task_exists(task_id):
        return {"__error__": {"status": 404, "body": {"message": "Task not found"}}}

    total = task_activity_db.task_activity_count(task_id)
    rows = task_activity_db.task_activity_list(task_id, page_size, offset)

    items: List[Dict[str, Any]] = []
    for r in rows:
        meta = r[6] or {}
        items.append({
            "id": r[0],
            "task_id": r[1],
            "actor_id": r[2],
            "actor_name": r[3] or "Unknown",
            "action": r[4],
            "message": r[5] or "",
            "meta": meta,
            "created_at": r[7].isoformat() if r[7] else None,
        })

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": (offset + page_size) < total,
    }


def get_my_activity_payload(user_id: int) -> Dict[str, Any]:
    rows = task_activity_db.user_activity_list(user_id, 10)

    activities: List[Dict[str, Any]] = []
    for r in rows:
        meta = r[7] or {}
        activities.append({
            "id": r[0],
            "task_id": r[1],
            "task_title": r[2] or "",
            "actor_id": r[3],
            "actor_name": r[4] or "Unknown",
            "action": r[5],
            "message": r[6] or "",
            "meta": meta,
            "created_at": r[8].isoformat() if r[8] else None,
        })

    return {"activities": activities}