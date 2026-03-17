from typing import List, Tuple, Any
from django.db import connection

def list_task_comments(task_id: int) -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_task_comments_list(%s);", [task_id])
        return cur.fetchall()

def create_task_comment(task_id: int, user_id: int, comment: str):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_task_comment_create(%s,%s,%s);", [task_id, user_id, comment])
        return cur.fetchone()
    