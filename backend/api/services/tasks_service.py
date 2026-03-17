from typing import Any, Dict, Optional, Tuple
import datetime

from api.db import tasks_db, project_db, project_member_db
from api.utils.activity import log_activity

VALID_TASK_STATUSES = {"PENDING", "IN_PROGRESS", "DONE"}


def list_tasks(
    role: str,
    user_id: int,
    page: int,
    page_size: int,
    q: str = "",
    assigned_to: Optional[int] = None,
    project_id: Optional[int] = None,
) -> Dict[str, Any]:
    offset = (page - 1) * page_size

    if role == "ADMIN":
        total = tasks_db.task_count(
            q=q,
            assigned_to=assigned_to,
            project_id=project_id,
        )

        rows = tasks_db.task_list(
            q=q,
            assigned_to=assigned_to,
            project_id=project_id,
            limit=page_size,
            offset=offset,
        )
    else:
        total = tasks_db.count_tasks_user(user_id)
        rows = tasks_db.list_tasks_user(user_id, page_size, offset)

    task_ids = [t["id"] for t in rows]

    attachments_rows = tasks_db.list_attachments_for_tasks(task_ids)

    attachments_by_task = {}
    for a_id, t_id, original_name, mime_type, uploaded_at in attachments_rows:
        attachments_by_task.setdefault(t_id, []).append({
            "id": a_id,
            "task_id": t_id,
            "original_name": original_name,
            "mime_type": mime_type,
            "uploaded_at": str(uploaded_at) if uploaded_at else None,
            "download_url": f"/api/attachments/{a_id}/download/",
        })

    tasks_list = []
    for t in rows:
        tasks_list.append({
            "id": t["id"],
            "title": t["title"],
            "description": t["description"],
            "status": t["status"],
            "assigned_to": t["assigned_to"],
            "assigned_to_name": t.get("assigned_to_name"),
            "project_id": t.get("project_id"),
            "project_name": t.get("project_name"),
            "due_date": t["due_date"],
            "attachments": attachments_by_task.get(t["id"], []),
        })

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if page > total_pages:
        page = total_pages

    return {
        "items": tasks_list,
        "tasks": tasks_list,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def get_task(role: str, user_id: int, task_id: int) -> Optional[Dict[str, Any]]:
    row = tasks_db.get_task_by_id(task_id)
    if not row:
        return None

    if role == "ADMIN":
        return row

    if row.get("assigned_to") != user_id:
        return None

    return row


def patch_task(task_id: int, body: dict) -> Tuple[int, Dict[str, Any]]:
    def norm(v):
        if v is None:
            return None
        if isinstance(v, str) and v.strip() == "":
            return None
        return v

    title = norm(body.get("title"))
    description = norm(body.get("description"))
    status = norm(body.get("status"))
    due_date = norm(body.get("due_date"))
    assigned_to = norm(body.get("assigned_to"))

    if assigned_to is not None:
        try:
            assigned_to = int(assigned_to)
        except Exception:
            return 400, {"message": "assigned_to is required"}

    if due_date is not None:
        try:
            if isinstance(due_date, str):
                due_date = datetime.date.fromisoformat(due_date)
        except Exception:
            return 400, {"message": "Invalid due_date"}

    tasks_db.update_task(task_id, title, description, status, due_date, assigned_to)

    row = tasks_db.get_task_by_id(task_id)
    if not row:
        return 404, {"message": "Task not found"}

    return 200, {"task": row}


def get_tasks_payload(page, page_size, q="", assigned_to=None):
    total = tasks_db.task_count(q=q, assigned_to=assigned_to)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    if page > total_pages:
        page = total_pages

    offset = (page - 1) * page_size
    rows = tasks_db.task_list(q=q, assigned_to=assigned_to, limit=page_size, offset=offset)

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "status": r["status"],
            "assigned_to": r["assigned_to"],
            "assigned_to_name": r.get("assigned_to_name"),
            "project_id": r.get("project_id"),
            "project_name": r.get("project_name"),
            "due_date": r["due_date"],
        })

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def _parse_due_date(value):
    if value in (None, "", "null"):
        return None
    if isinstance(value, datetime.date):
        return value
    if not isinstance(value, str):
        return None
    try:
        return datetime.date.fromisoformat(value.strip()[:10])
    except Exception:
        return None


def create_task_service(body, actor_id):
    title = (body.get("title") or "").strip()
    description = (body.get("description") or "").strip() or None
    status = (body.get("status") or "PENDING").strip().upper()
    assigned_to = body.get("assigned_to")
    project_id = body.get("project_id")
    due_date = _parse_due_date(body.get("due_date"))

    errors = {}

    if not title:
        errors["title"] = "Title is required"

    if status not in VALID_TASK_STATUSES:
        errors["status"] = "Invalid status"

    if not project_id:
        errors["project_id"] = "Project is required"
    elif not project_db.project_exists(project_id):
        errors["project_id"] = "Project not found"

    if not assigned_to:
        errors["assigned_to"] = "Assigned user is required"

    if project_id and assigned_to and project_db.project_exists(project_id):
        if not project_member_db.is_user_in_project(project_id, assigned_to):
            errors["assigned_to"] = "Selected user is not a member of this project"

    if body.get("due_date") not in (None, "", "null") and due_date is None:
        errors["due_date"] = "Invalid due_date"

    if errors:
        return {"ok": False, "errors": errors}

    task = tasks_db.create_task_with_project(
        title=title,
        description=description,
        status=status,
        assigned_by=actor_id,
        assigned_to=assigned_to,
        due_date=due_date,
        project_id=project_id,
    )

    log_activity(
        task_id=task["id"],
        actor_id=actor_id,
        action="TASK_CREATED",
        message=f"Created task {task['title']}",
        project_id=project_id,
        meta={
            "task_id": task["id"],
            "task_title": task["title"],
            "project_id": project_id,
            "assigned_to": assigned_to,
        },
    )

    return {"ok": True, "task": task}


def update_task_service(task_id, body, actor_id):
    old_task = tasks_db.get_task_by_id(task_id)
    if not old_task:
        return {"ok": False, "message": "Task not found"}

    title = (body.get("title") if "title" in body else old_task["title"]) or ""
    title = title.strip()

    description = body.get("description", old_task["description"])
    if isinstance(description, str):
        description = description.strip() or None

    status = (body.get("status", old_task["status"]) or "PENDING").strip().upper()
    assigned_to = body.get("assigned_to", old_task["assigned_to"])
    project_id = body.get("project_id", old_task["project_id"])
    due_date_raw = body.get("due_date", old_task["due_date"])
    due_date = _parse_due_date(due_date_raw)

    errors = {}

    if not title:
        errors["title"] = "Title is required"

    if status not in VALID_TASK_STATUSES:
        errors["status"] = "Invalid status"

    if not project_id:
        errors["project_id"] = "Project is required"
    elif not project_db.project_exists(project_id):
        errors["project_id"] = "Project not found"

    if not assigned_to:
        errors["assigned_to"] = "Assigned user is required"

    if project_id and assigned_to and project_db.project_exists(project_id):
        if not project_member_db.is_user_in_project(project_id, assigned_to):
            errors["assigned_to"] = "Selected user is not a member of this project"

    if due_date_raw not in (None, "", "null") and due_date is None:
        errors["due_date"] = "Invalid due_date"

    if errors:
        return {"ok": False, "errors": errors}

    task = tasks_db.update_task_project_fields(
        task_id=task_id,
        title=title,
        description=description,
        status=status,
        assigned_to=assigned_to,
        due_date=due_date,
        project_id=project_id,
    )

    log_activity(
        task_id=task_id,
        actor_id=actor_id,
        action="TASK_UPDATED",
        message=f"Updated task {task['title']}",
        project_id=project_id,
        meta={
            "task_id": task_id,
            "task_title": task["title"],
            "project_id": project_id,
            "assigned_to": assigned_to,
            "status": status,
        },
    )

    return {"ok": True, "task": task}