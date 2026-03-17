from typing import Any, Dict, Optional
from api.db import activity_logger_db


def log_activity_service(
    task_id: int,
    actor_id: Optional[int],
    action: str,
    message: str = "",
    project_id: Optional[int] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    if meta is None:
        meta = {}

    try:
        activity_logger_db.insert_activity(
            task_id=task_id,
            actor_id=actor_id,
            action=action,
            message=message or "",
            project_id=project_id,
            meta=meta,
        )
    except Exception as e:
        print("log_activity failed:", repr(e))
        return