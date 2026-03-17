from typing import List, Tuple, Any
from django.db import connection

def me_attachments_admin() -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_me_attachments_admin();")
        return cur.fetchall()

def me_attachments_user(user_id: int) -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_me_attachments_user(%s);", [user_id])
        return cur.fetchall()

def me_comments_admin() -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_me_comments_admin();")
        return cur.fetchall()

def me_comments_user(user_id: int) -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_me_comments_user(%s);", [user_id])
        return cur.fetchall()