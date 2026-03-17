from django.db import connection

def task_exists(task_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT EXISTS(SELECT 1 FROM tasks WHERE id = %s)", [task_id])
        return cur.fetchone()[0]


def task_activity_count(task_id: int) -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_task_activity_count(%s)", [task_id])
        return int(cur.fetchone()[0])


def task_activity_list(task_id: int, limit: int, offset: int):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_task_activity_list(%s, %s, %s)",
            [task_id, limit, offset],
        )
        return cur.fetchall()


def user_activity_list(user_id: int, limit: int = 10):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_user_activity_list(%s, %s)",
            [user_id, limit],
        )
        return cur.fetchall()