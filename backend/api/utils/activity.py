from __future__ import annotations
from typing import Any, Dict, Optional

from api.services.activity_logger_service import log_activity_service

TASK_CREATED = "TASK_CREATED"
TASK_UPDATED = "TASK_UPDATED"
STATUS_CHANGED = "STATUS_CHANGED"
TASK_DELETED = "TASK_DELETED"
COMMENT_ADDED = "COMMENT_ADDED"
COMMENT_DELETED = "COMMENT_DELETED"
ATTACHMENT_UPLOADED = "ATTACHMENT_UPLOADED"
ATTACHMENT_DELETED = "ATTACHMENT_DELETED"

__all__ = [
    "log_activity",
    "TASK_CREATED",
    "TASK_UPDATED",
    "STATUS_CHANGED",
    "TASK_DELETED",
    "COMMENT_ADDED",
    "COMMENT_DELETED",
    "ATTACHMENT_UPLOADED",
    "ATTACHMENT_DELETED",
]


def log_activity(
    task_id: int,
    actor_id: Optional[int],
    action: str,
    message: str = "",
    project_id: Optional[int] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> None:
    log_activity_service(
        task_id=task_id,
        actor_id=actor_id,
        action=action,
        message=message,
        meta=meta,
    )