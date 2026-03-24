from typing import Any, Dict, Optional
import os
import uuid

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import NotFound, PermissionDenied

from api.db import tasks_db, project_db, project_member_db
from api.db.users_db import get_user_email_name
from api.exceptions import BadRequestError
from api.services.activity_logger_service import log_activity_service
from api.utils.activity import (
    ATTACHMENT_UPLOADED,
    STATUS_CHANGED,
    TASK_CREATED,
    TASK_DELETED,
    TASK_UPDATED,
)
from api.utils.mailer import send_task_assigned_email

VALID_TASK_STATUSES = {"PENDING", "IN_PROGRESS", "DONE"}

def ensure_task_access_service(role: str, user_id: int, task_id: int):
    task = tasks_db.get_task_by_id(task_id)
    if not task:
        raise NotFound("Task not found")

    if role in ("ADMIN", "SUPERUSER"):
        return task

    if task.get("assigned_to") != user_id:
        raise PermissionDenied("Forbidden")

    return task

def list_tasks_service(role: str, user_id: int, params) -> Dict[str, Any]:
    page = params["page"]
    page_size = params["page_size"]
    q = params.get("q", "")
    assigned_to = params.get("assigned_to")
    project_id = params.get("project_id")

    offset = (page - 1) * page_size

    if role in ("ADMIN", "SUPERUSER"):
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

    task_ids = [task["id"] for task in rows]
    attachments_rows = tasks_db.list_attachments_for_tasks(task_ids)

    attachments_by_task = {}
    for a_id, t_id, original_name, mime_type, uploaded_at in attachments_rows:
        attachments_by_task.setdefault(t_id, []).append(
            {
                "id": a_id,
                "task_id": t_id,
                "original_name": original_name,
                "mime_type": mime_type,
                "uploaded_at": str(uploaded_at) if uploaded_at else None,
                "download_url": f"/api/attachments/{a_id}/download/",
            }
        )

    tasks_list = []
    for task in rows:
        tasks_list.append(
            {
                "id": task["id"],
                "title": task["title"],
                "description": task["description"],
                "status": task["status"],
                "assigned_to": task["assigned_to"],
                "assigned_to_name": task.get("assigned_to_name"),
                "project_id": task.get("project_id"),
                "project_name": task.get("project_name"),
                "due_date": task["due_date"],
                "attachments": attachments_by_task.get(task["id"], []),
            }
        )

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


def get_task_service(role: str, user_id: int, task_id: int) -> Dict[str, Any]:
    task = tasks_db.get_task_by_id(task_id)
    if not task:
        raise NotFound("Task not found")

    if role not in ("ADMIN", "SUPERUSER") and task.get("assigned_to") != user_id:
        raise NotFound("Task not found")

    return {"task": task}


def create_task_service(
    current_user,
    current_user_id: int,
    role: str,
    data: Dict[str, Any],
    files=None,
) -> Dict[str, Any]:
    if role not in ("ADMIN", "SUPERUSER"):
        raise PermissionDenied("Only admin can create tasks")

    title = data["title"].strip()
    description = data.get("description")
    assigned_to = data["assigned_to"]
    project_id = data["project_id"]
    status_value = data.get("status", "PENDING")
    due_date = data.get("due_date")

    _validate_task_create_payload(
        title=title,
        status_value=status_value,
        assigned_to=assigned_to,
        project_id=project_id,
    )

    task = tasks_db.create_task_with_project(
        title=title,
        description=description or None,
        status=status_value,
        assigned_by=current_user_id,
        assigned_to=assigned_to,
        due_date=due_date,
        project_id=project_id,
    )

    saved_names = []
    saved_paths = []

    if files:
        saved_names, saved_paths = _save_task_attachments(task["id"], files)

    log_activity_service(
        task_id=task["id"],
        actor_id=current_user_id,
        action=TASK_CREATED,
        message=f"Created task {task['title']}",
        project_id=project_id,
        meta={
            "task_id": task["id"],
            "task_title": task["title"],
            "project_id": project_id,
            "assigned_to": assigned_to,
        },
    )

    if saved_names:
        log_activity_service(
            task_id=task["id"],
            actor_id=current_user_id,
            action=ATTACHMENT_UPLOADED,
            message=f"{len(saved_names)} attachment(s) uploaded",
            meta={"files": saved_names},
        )

    _send_assignment_mail(
        assigned_to=assigned_to,
        task_id=task["id"],
        title=task["title"],
        due_date=due_date,
        description=description,
        attachment_paths=saved_paths,
    )

    return {
        "message": "Task created successfully",
        "task": task,
    }


def update_task_service(
    current_user,
    current_user_id: int,
    role: str,
    task_id: int,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    if role not in ("ADMIN", "SUPERUSER"):
        raise PermissionDenied("Forbidden")

    old = tasks_db.get_task_old_values(task_id)
    if not old:
        raise NotFound("Task not found")

    title = data["title"].strip()
    description = data.get("description")
    status_value = data["status"]
    assigned_to = data["assigned_to"]
    due_date = data.get("due_date")

    _validate_task_update_payload(
        title=title,
        status_value=status_value,
        assigned_to=assigned_to,
    )

    old_title, old_desc, old_status, old_assigned_to, old_due = old

    tasks_db.update_task_admin(
        task_id=task_id,
        title=title,
        description=description,
        status=status_value,
        assigned_to=assigned_to,
        due_date=due_date,
    )

    updated_task = tasks_db.get_task_by_id(task_id)

    meta = {
        "old": {
            "title": old_title,
            "description": old_desc,
            "status": old_status,
            "assigned_to": old_assigned_to,
            "due_date": str(old_due) if old_due else None,
        },
        "new": {
            "title": title,
            "description": description,
            "status": status_value,
            "assigned_to": assigned_to,
            "due_date": str(due_date) if due_date else None,
        },
    }

    if old_status != status_value:
        log_activity_service(
            task_id=task_id,
            actor_id=current_user_id,
            action=STATUS_CHANGED,
            message=f"Status changed {old_status} → {status_value}",
            meta=meta,
        )
    else:
        log_activity_service(
            task_id=task_id,
            actor_id=current_user_id,
            action=TASK_UPDATED,
            message="Task updated",
            meta=meta,
        )

    return {
        "message": "Task updated successfully",
        "task": updated_task,
    }


def delete_task_service(
    current_user,
    current_user_id: int,
    role: str,
    task_id: int,
) -> Dict[str, Any]:
    if role not in ("ADMIN", "SUPERUSER"):
        raise PermissionDenied("Forbidden")

    task = tasks_db.get_task_by_id(task_id)
    if not task:
        raise NotFound("Task not found")

    try:
        log_activity_service(
            task_id=task_id,
            actor_id=current_user_id,
            action=TASK_DELETED,
            message="Task deleted",
        )
    except Exception:
        pass

    tasks_db.delete_task(task_id)
    return {"message": "Task deleted successfully"}


def update_my_task_status_service(
    current_user,
    current_user_id: int,
    role: str,
    task_id: int,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    if role != "USER":
        raise PermissionDenied("Only users can update task status here")

    new_status = data["status"]

    old_status = tasks_db.get_task_status_for_user(task_id, current_user_id)
    if old_status is None:
        raise PermissionDenied("Forbidden")

    tasks_db.user_update_task_status(task_id, current_user_id, new_status)

    if old_status != new_status:
        log_activity_service(
            task_id=task_id,
            actor_id=current_user_id,
            action=STATUS_CHANGED,
            message=f"Status changed {old_status} → {new_status}",
            meta={"old": {"status": old_status}, "new": {"status": new_status}},
        )
    else:
        log_activity_service(
            task_id=task_id,
            actor_id=current_user_id,
            action=TASK_UPDATED,
            message="Status updated",
            meta={"status": new_status},
        )

    return {"message": "Status updated"}


def my_tasks_service(current_user, current_user_id: int) -> Dict[str, Any]:
    rows = tasks_db.list_tasks_for_user(current_user_id)
    return {"tasks": rows}


def _validate_task_create_payload(
    title: str,
    status_value: str,
    assigned_to: Optional[int],
    project_id: Optional[int],
) -> None:
    errors = {}

    if not title:
        errors["title"] = "Title is required"

    if status_value not in VALID_TASK_STATUSES:
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

    if errors:
        raise BadRequestError(errors)


def _validate_task_update_payload(
    title: str,
    status_value: str,
    assigned_to: Optional[int],
) -> None:
    errors = {}

    if not title:
        errors["title"] = "Title is required"

    if status_value not in VALID_TASK_STATUSES:
        errors["status"] = "Invalid status"

    if not assigned_to:
        errors["assigned_to"] = "Assigned user is required"

    if errors:
        raise BadRequestError(errors)


def _save_task_attachments(task_id: int, files):
    saved_names = []
    saved_paths = []

    for file_obj in files:
        folder = os.path.join(settings.MEDIA_ROOT, "task_attachments", str(task_id))
        os.makedirs(folder, exist_ok=True)

        stored_name = f"{uuid.uuid4().hex}_{file_obj.name}"
        full_path = os.path.join(folder, stored_name)

        with open(full_path, "wb+") as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        tasks_db.insert_task_attachment(
            task_id,
            file_obj.name,
            stored_name,
            full_path,
            getattr(file_obj, "content_type", None),
        )

        saved_names.append(file_obj.name)
        saved_paths.append(full_path)

    return saved_names, saved_paths


def _send_assignment_mail(
    assigned_to: int,
    task_id: int,
    title: str,
    due_date,
    description=None,
    attachment_paths=None,
):
    assignee = get_user_email_name(assigned_to)

    def _send_mail():
        try:
            if assignee and assignee.get("email"):
                send_task_assigned_email(
                    email=assignee["email"],
                    assignee_name=assignee.get("name"),
                    task_id=task_id,
                    title=title,
                    due_date=str(due_date) if due_date else None,
                    description=description or None,
                    attachment_paths=attachment_paths or None,
                )
        except Exception as e:
            print("ASSIGNEE MAIL ERROR:", str(e))

    transaction.on_commit(_send_mail)