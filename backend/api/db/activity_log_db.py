from django.db import connection
import json


def log_activity(task_id=None, actor_id=None, action="", message="", meta=None, project_id=None):
    with connection.cursor() as cur:
        cur.execute(
            "CALL sp_log_activity(%s, %s, %s, %s, %s, %s)",
            [
                task_id,
                actor_id,
                action,
                message,
                json.dumps(meta or {}),
                project_id,
            ],
        )