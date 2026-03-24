from typing import Any, Dict, List
from api.db import me_db

def get_me_attachments(role: str, user_id: int) -> List[Dict[str, Any]]:
    rows = me_db.me_attachments_admin() if role in ("ADMIN", "SUPERUSER") else me_db.me_attachments_user(user_id)
    out = []
    for a_id, task_id, original_name, mime_type, uploaded_at, task_title in rows:
        out.append({
            "id": a_id,
            "task_id": task_id,
            "task_title": task_title,
            "original_name": original_name,
            "mime_type": mime_type,
            "uploaded_at": str(uploaded_at) if uploaded_at else None,
            "download_url": f"/api/attachments/{a_id}/download/",
        })
    return out

def get_me_comments(role: str, user_id: int) -> List[Dict[str, Any]]:
    rows = me_db.me_comments_admin() if role in ("ADMIN", "SUPERUSER") else me_db.me_comments_user(user_id)
    out = []
    for cid, task_id, uid, uname, comment, created_at, task_title in rows:
        out.append({
            "id": cid,
            "task_id": task_id,
            "task_title": task_title,
            "user_id": uid,
            "user_name": uname,
            "comment": comment,
            "created_at": str(created_at) if created_at else None,
        })
    return out