import json
from django.db import connection


def _parse_json_result(value, default):
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return default


def user_has_project_access(project_id: int, user_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_user_has_project_access(%s, %s)",
            [project_id, user_id]
        )
        row = cur.fetchone()
    return bool(row[0]) if row else False


def list_user_projects(user_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_list_user_projects(%s)", [user_id])
        row = cur.fetchone()
    return _parse_json_result(row[0] if row else None, [])


def get_user_project_detail(project_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_get_user_project_detail(%s)", [project_id])
        row = cur.fetchone()
    return _parse_json_result(row[0] if row else None, None)


def list_user_project_tasks(project_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_list_user_project_tasks(%s)", [project_id])
        row = cur.fetchone()
    return _parse_json_result(row[0] if row else None, [])


def list_user_project_members(project_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_list_user_project_members(%s)", [project_id])
        row = cur.fetchone()
    return _parse_json_result(row[0] if row else None, [])


def list_user_project_activity(project_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_list_user_project_activity(%s)", [project_id])
        row = cur.fetchone()
    return _parse_json_result(row[0] if row else None, [])


def project_exists(project_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_project_exists(%s)", [project_id])
        row = cur.fetchone()
    return bool(row[0]) if row else False