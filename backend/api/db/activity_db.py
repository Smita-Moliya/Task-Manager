import json
from django.db import connection
from typing import Any, Optional, Dict

try:
    from psycopg2.extras import Json
except Exception:
    Json = None

def admin_activity_count(task_id, actor_id, action, q) -> int:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_admin_activity_count(%s,%s,%s,%s)",
            [task_id, actor_id, action, q],
        )
        return int(cur.fetchone()[0])


def admin_activity_list(task_id, actor_id, action, q, limit: int, offset: int):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_admin_activity_list(%s,%s,%s,%s,%s,%s)",
            [task_id, actor_id, action, q, limit, offset],
        )
        return cur.fetchall()
    

def user_activity_list(user_id: int, limit: int = 10):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_user_activity_list(%s, %s)",
            [user_id, limit],
        )
        return cur.fetchall()
