from api.db.access_control_db import fetch_page_access_for_role

SUPERUSER_ALL = {
    "view_users",
    "create_user",
    "edit_user",
    "delete_user",
    "create_admin",
    "edit_admin",
    "delete_admin",
    "assign_roles",
    "grant_permissions",
    "revoke_permissions",
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",
    "manage_project_members",
    "view_tasks",
    "create_task",
    "edit_task",
    "delete_task",
    "change_own_task_status",
    "view_admin_stats",
    "view_admin_activity",
    "view_all_attachments",
    "view_all_comments",
    "manage_page_access",
    "view_dashboard",
}

ADMIN_DEFAULT = {
    "view_users",
    "create_user",
    "edit_user",
    "delete_user",
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",
    "manage_project_members",
    "view_tasks",
    "create_task",
    "edit_task",
    "delete_task",
    "view_admin_stats",
    "view_admin_activity",
    "view_all_attachments",
    "view_all_comments",
    "view_dashboard",
}

USER_DEFAULT = {
    "view_tasks",
    "change_own_task_status",
    "view_projects",
}


def get_role_base_permissions(role: str) -> set[str]:
    role = (role or "").upper()
    if role == "SUPERUSER":
        return set(SUPERUSER_ALL)
    if role == "ADMIN":
        return set(ADMIN_DEFAULT)
    return set(USER_DEFAULT)


def get_user_permission_overrides(user_id: int) -> dict[str, bool]:
    return {}


def get_effective_permissions(user_id: int, role: str) -> dict[str, bool]:
    return {code: True for code in get_role_base_permissions(role)}


def has_permission(user: dict, permission_code: str) -> bool:
    if not user:
        return False
    perms = get_effective_permissions(user["id"], user["role"])
    return perms.get(permission_code, False)


def get_allowed_pages(user: dict) -> dict[str, bool]:
    if not user:
        return {}

    role = str(user.get("role", "")).upper()

    if role == "SUPERUSER":
        return {
            "admin.dashboard": True,
            "admin.users": True,
            "admin.projects": True,
            "admin.tasks": True,
            "admin.analytics": True,
            "admin.activity": True,
            "user.tasks": True,
            "user.projects": True,
            "user.activity": True,
            "user.comments": True,
            "user.attachments": True,
            "user.insights": True,
        }

    rows = fetch_page_access_for_role(role)
    return {
        row["page_key"]: bool(row["allowed"])
        for row in rows
    }