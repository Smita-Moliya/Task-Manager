from typing import Any, Dict, List
from api.db import comments_db

def get_task_comments(task_id: int) -> List[Dict[str, Any]]:
    rows = comments_db.list_task_comments(task_id)
    return [
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

def add_task_comment(task_id: int, user_id: int, comment: str) -> Dict[str, Any]:
    cid, created_at = comments_db.create_task_comment(task_id, user_id, comment)
    return {
        "id": cid,
        "task_id": task_id,
        "user_id": user_id,
        "comment": comment,
        "created_at": str(created_at) if created_at else None,
    }