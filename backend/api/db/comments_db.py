from typing import List, Tuple, Any
from django.db import connection
import traceback

def list_task_comments(task_id: int) -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_task_comments_list(%s);", [task_id])
        return cur.fetchall()

def create_task_comment(task_id: int, user_id: int, comment: str):
    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT * FROM fn_task_comment_create(%s, %s, %s);",
                [task_id, user_id, comment]
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError("fn_task_comment_create returned no row")
            return row
    except Exception as e:
        print("create_task_comment ERROR:", repr(e))
        print("task_id =", task_id)
        print("user_id =", user_id, type(user_id))
        print("comment =", comment)
        traceback.print_exc()
        raise