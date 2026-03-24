from api.db.activity_export_db import list_activity_logs_for_export_db

def export_activity_logs_service(filters):
    return list_activity_logs_for_export_db(
        q=filters.get("q"),
        task_id=filters.get("task_id"),
        actor_id=filters.get("actor_id"),
        action=filters.get("action"),
    )