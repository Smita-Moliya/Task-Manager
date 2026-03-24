from rest_framework.exceptions import PermissionDenied, NotFound

from api.db import user_project_db

def _ensure_project_exists(project_id: int) -> None:
    if not user_project_db.project_exists(project_id):
        raise NotFound("Project not found")

def _get_project_or_404(project_id: int):
    project = user_project_db.get_user_project_detail(project_id)
    if not project:
        raise NotFound("Project not found")
    return project


def _check_project_access(project_id: int, user_id: int) -> None:
    has_access = user_project_db.user_has_project_access(project_id, user_id)
    if not has_access:
        raise PermissionDenied("Forbidden")


def list_user_projects_service(user_id: int):
    projects = user_project_db.list_user_projects(user_id)
    return {"projects": projects}


def get_user_project_detail_service(project_id: int, user_id: int):
    project = _get_project_or_404(project_id)
    _check_project_access(project_id, user_id)
    return {"project": project}


def list_user_project_tasks_service(project_id: int, user_id: int):
    _get_project_or_404(project_id)
    _check_project_access(project_id, user_id)

    tasks = user_project_db.list_user_project_tasks(project_id)
    return {"tasks": tasks}


def list_user_project_members_service(project_id: int, user_id: int):
    _get_project_or_404(project_id)
    _check_project_access(project_id, user_id)

    members = user_project_db.list_user_project_members(project_id)
    return {"members": members}


def list_user_project_activity_service(project_id: int, user_id: int):
    _get_project_or_404(project_id)
    _check_project_access(project_id, user_id)

    activity = user_project_db.list_user_project_activity(project_id)
    return {"activity": activity}

