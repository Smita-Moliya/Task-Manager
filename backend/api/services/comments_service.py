from typing import Any, Dict

from rest_framework.exceptions import PermissionDenied

from api.db import comments_db
from api.exceptions import BadRequestError
from api.services.activity_logger_service import log_activity_service
from api.services.tasks_service import ensure_task_access_service
from api.utils.activity import COMMENT_ADDED


def list_task_comments_service(request, task_id: int) -> Dict[str, Any]:
    ensure_task_access_service(request.role, request.user_id, task_id)

    rows = comments_db.list_task_comments(task_id)

    comments = [
        {
            "id": cid,
            "task_id": tid,
            "user_id": uid,
            "user_name": uname,
            "comment": comment,
            "created_at": str(created_at) if created_at else None,
        }
        for cid, tid, uid, uname, comment, created_at in rows
    ]

    return {"comments": comments}


def add_task_comment_service(request, task_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    ensure_task_access_service(request.role, request.user_id, task_id)

    user_id = getattr(request, "user_id", None)
    if not user_id:
        raise PermissionDenied("Unauthorized")

    comment = (data.get("comment") or "").strip()
    if not comment:
        raise BadRequestError({"comment": ["This field is required."]})

    row = comments_db.create_task_comment(task_id, user_id, comment)
    cid, created_at = row

    created = {
        "id": cid,
        "task_id": task_id,
        "user_id": user_id,
        "comment": comment,
        "created_at": str(created_at) if created_at else None,
    }

    try:
        log_activity_service(
            task_id=task_id,
            actor_id=user_id,
            action=COMMENT_ADDED,
            message="Comment added",
            meta={"comment_id": created["id"], "comment": comment[:200]},
        )
    except Exception:
        pass

    return {
        "message": "Comment added ✅",
        "comment": created,
    }