from django.db import connection


def admin_activity_count(task_id, actor_id, action, q) -> int:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_admin_activity_count(%s, %s, %s, %s)",
            [task_id, actor_id, action, q],
        )
        return int(cur.fetchone()[0])


def admin_activity_list(task_id, actor_id, action, q, limit: int, offset: int):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_admin_activity_list(%s, %s, %s, %s, %s, %s)",
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


def export_activity_logs_db(q=None, task_id=None, actor_id=None, action=None):
    sql = """
        SELECT
            al.id,
            al.task_id,
            COALESCE(t.title, '') AS task_title,
            al.actor_id,
            COALESCE(u.name, '') AS actor_name,
            al.action,
            COALESCE(al.message, '') AS message,
            al.created_at
        FROM activity_logs al
        LEFT JOIN tasks t ON t.id = al.task_id
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE (%s IS NULL OR (
            CAST(al.id AS TEXT) ILIKE %s OR
            CAST(al.task_id AS TEXT) ILIKE %s OR
            COALESCE(t.title, '') ILIKE %s OR
            CAST(al.actor_id AS TEXT) ILIKE %s OR
            COALESCE(u.name, '') ILIKE %s OR
            COALESCE(al.action, '') ILIKE %s OR
            COALESCE(al.message, '') ILIKE %s
        ))
        AND (%s IS NULL OR al.task_id = %s)
        AND (%s IS NULL OR al.actor_id = %s)
        AND (%s IS NULL OR al.action = %s)
        ORDER BY al.created_at DESC, al.id DESC
    """

    q_like = f"%{q}%" if q else None

    params = [
        q, q_like, q_like, q_like, q_like, q_like, q_like, q_like,
        task_id, task_id,
        actor_id, actor_id,
        action, action,
    ]

    with connection.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()