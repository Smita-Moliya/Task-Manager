from typing import Optional, Tuple
from django.db import connection


def get_user_basic_by_email(email: str) -> Optional[Tuple[int, str, str, str]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_auth_user_basic_by_email(%s)", [email])
        return cur.fetchone()


def create_google_user(name: str, email: str, role: str) -> int:
    with connection.cursor() as cur:
        cur.callproc("sp_auth_create_google_user", [name, email, role])
        out = cur.fetchone()
    return int(out[0])