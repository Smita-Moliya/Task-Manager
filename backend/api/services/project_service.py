import datetime
from api.db import project_db
from api.utils.activity import log_activity

VALID_PROJECT_STATUSES = {"ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"}
VALID_PROJECT_PRIORITIES = {"LOW", "MEDIUM", "HIGH"}


def _parse_date(value, field_name, errors):
    if value in (None, "", "null"):
        return None
    if isinstance(value, datetime.date):
        return value
    if not isinstance(value, str):
        errors[field_name] = f"Invalid {field_name}"
        return None
    try:
        return datetime.date.fromisoformat(value.strip()[:10])
    except Exception:
        errors[field_name] = f"Invalid {field_name}"
        return None


def validate_project_payload(body):
    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip() or None
    status = (body.get("status") or "ACTIVE").strip().upper()
    priority = (body.get("priority") or "MEDIUM").strip().upper()

    errors = {}

    if not name:
        errors["name"] = "Project name is required"

    if status not in VALID_PROJECT_STATUSES:
        errors["status"] = "Invalid status"

    if priority not in VALID_PROJECT_PRIORITIES:
        errors["priority"] = "Invalid priority"

    start_date = _parse_date(body.get("start_date"), "start_date", errors)
    end_date = _parse_date(body.get("end_date"), "end_date", errors)

    if start_date and end_date and end_date < start_date:
        errors["end_date"] = "End date cannot be before start date"

    return {
        "errors": errors,
        "cleaned": {
            "name": name,
            "description": description,
            "status": status,
            "priority": priority,
            "start_date": start_date,
            "end_date": end_date,
        }
    }


def create_project_service(body, actor_id):
    result = validate_project_payload(body)
    if result["errors"]:
        return {"ok": False, "errors": result["errors"]}

    c = result["cleaned"]

    project = project_db.create_project(
        name=c["name"],
        description=c["description"],
        status=c["status"],
        priority=c["priority"],
        start_date=c["start_date"],
        end_date=c["end_date"],
        created_by=actor_id,
    )

    return {"ok": True, "project": project}


def list_projects_service(q="", status=None):
    status = (status or "").strip().upper() or None
    if status and status not in VALID_PROJECT_STATUSES:
        status = None
    return {"ok": True, "projects": project_db.list_projects(q=q, status=status)}


def get_project_detail_service(project_id):
    project = project_db.get_project_by_id(project_id)
    if not project:
        return {"ok": False, "message": "Project not found"}

    summary = project_db.get_project_summary(project_id)
    return {"ok": True, "project": project, "summary": summary}


def update_project_service(project_id, body, actor_id):
    if not project_db.project_exists(project_id):
        return {"ok": False, "message": "Project not found"}

    result = validate_project_payload(body)
    if result["errors"]:
        return {"ok": False, "errors": result["errors"]}

    c = result["cleaned"]

    project = project_db.update_project(
        project_id=project_id,
        name=c["name"],
        description=c["description"],
        status=c["status"],
        priority=c["priority"],
        start_date=c["start_date"],
        end_date=c["end_date"],
    )

    return {"ok": True, "project": project}


def delete_project_service(project_id, actor_id):
    project = project_db.get_project_by_id(project_id)
    if not project:
        return {"ok": False, "message": "Project not found"}

    task_count = project_db.project_task_count(project_id)
    if task_count > 0:
        return {"ok": False, "message": "Cannot delete project with existing tasks"}

    deleted = project_db.delete_project(project_id)
    if not deleted:
        return {"ok": False, "message": "Delete failed"}

    return {"ok": True}