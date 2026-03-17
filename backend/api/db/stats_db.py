from typing import List, Tuple, Any
from django.db import connection


def admin_stats_by_status() -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_admin_stats_by_status();")
        return cur.fetchall()


def admin_stats_by_user() -> List[Tuple[Any, ...]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_admin_stats_by_user();")
        return cur.fetchall()