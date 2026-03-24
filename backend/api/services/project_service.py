from rest_framework.exceptions import NotFound
from api.db import project_db
from api.exceptions import BadRequestError
from api.services.activity_logger_service import log_activity_service


def create_project_service(*, request, data):
    project = project_db.create_project(
        name=data["name"],
        description=data.get("description") or None,
        status=data.get("status", "ACTIVE"),
        priority=data.get("priority", "MEDIUM"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        created_by=request.user_id,
    )

    log_activity_service(
        task_id=None,
        actor_id=request.user_id,
        action="PROJECT_CREATED",
        message=f"Project '{project['name']}' created",
        project_id=project["id"],
        meta={
            "project_id": project["id"],
            "project_name": project["name"],
        },
    )

    return {
        "message": "Project created successfully",
        "project": project,
    }


def list_projects_service(*, filters):
    q = (filters.get("q") or "").strip()
    status = filters.get("status")

    projects = project_db.list_projects(q=q, status=status)
    return {
        "projects": projects
    }


def get_project_detail_service(*, project_id):
    project = project_db.get_project_by_id(project_id)
    if not project:
        raise NotFound("Project not found")

    summary = project_db.get_project_summary(project_id)

    return {
        "project": project,
        "summary": summary,
    }


def update_project_service(*, request, project_id, data):
    existing_project = project_db.get_project_by_id(project_id)
    if not existing_project:
        raise NotFound("Project not found")

    project = project_db.update_project(
        project_id=project_id,
        name=data["name"],
        description=data.get("description") or None,
        status=data.get("status", "ACTIVE"),
        priority=data.get("priority", "MEDIUM"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
    )

    log_activity_service(
        task_id=None,
        actor_id=request.user_id,
        action="PROJECT_UPDATED",
        message=f"Project '{project['name']}' updated",
        project_id=project_id,
        meta={
            "project_id": project_id,
            "project_name": project["name"],
        },
    )

    return {
        "message": "Project updated successfully",
        "project": project,
    }


def delete_project_service(*, request, project_id):
    project = project_db.get_project_by_id(project_id)
    if not project:
        raise NotFound("Project not found")

    task_count = project_db.project_task_count(project_id)
    if task_count > 0:
        raise BadRequestError({
            "message": "Cannot delete project with existing tasks"
        })

    deleted = project_db.delete_project(project_id)
    if not deleted:
        raise BadRequestError({
            "message": "Delete failed"
        })

    log_activity_service(
        task_id=None,
        actor_id=request.user_id,
        action="PROJECT_DELETED",
        message=f"Project '{project['name']}' deleted",
        project_id=project_id,
        meta={
            "project_id": project_id,
            "project_name": project["name"],
        },
    )

    return {
        "message": "Project deleted successfully"
    }