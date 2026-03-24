import json
from django.db import connection


def insert_activity(task_id, actor_id, action, message="", project_id=None, meta=None):
    if meta is None:
        meta = {}

    with connection.cursor() as cur:
        cur.execute(
            "CALL sp_insert_activity(%s, %s, %s, %s, %s, %s)",
            [
                task_id,
                actor_id,
                action,
                message,
                project_id,
                json.dumps(meta),
            ],
        )