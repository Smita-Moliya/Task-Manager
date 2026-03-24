from api.db.admin_dashboard_db import get_admin_dashboard_db


def get_admin_dashboard_service():
    data = get_admin_dashboard_db() or {}

    data.setdefault("total_users", 0)
    data.setdefault("active_projects", 0)
    data.setdefault("open_tasks", 0)
    data.setdefault("system_activity", 0)
    data.setdefault("users_growth_text", "+0 this month")
    data.setdefault("high_priority_projects", 0)
    data.setdefault("tasks_due_this_week", 0)
    data.setdefault("system_health_text", "Healthy performance")
    data.setdefault("recent_activity", [])

    summary = data.get("summary") or {}
    summary.setdefault("completed_tasks", 0)
    summary.setdefault("pending_reviews", 0)
    summary.setdefault("new_projects", 0)
    summary.setdefault("inactive_users", 0)
    data["summary"] = summary

    return data