from django.db import connection
import json


def log_activity(task_id=None, actor_id=None, action="", message="", meta=None, project_id=None):
    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO activity_logs (
                task_id, actor_id, action, message, meta, project_id, created_at
            )
            VALUES (%s, %s, %s, %s, %s::jsonb, %s, NOW())
        """, [
            task_id,
            actor_id,
            action,
            message,
            json.dumps(meta or {}),
            project_id,
        ])