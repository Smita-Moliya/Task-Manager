import json
from django.db import connection

try:
    from psycopg2.extras import Json
except Exception:
    Json = None


def insert_activity(task_id, actor_id, action, message="", project_id=None, meta=None):
    if meta is None:
        meta = {}

    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO activity_logs (
                task_id,
                actor_id,
                action,
                message,
                project_id,
                meta,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, [
            task_id,
            actor_id,
            action,
            message,
            project_id,
            Json(meta) if Json else json.dumps(meta),
        ])