from typing import Optional, Tuple
from django.db import connection


def get_user_by_email(email: str) -> Optional[Tuple[int, str, str, str, str]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_auth_user_by_email(%s)", [email])
        return cur.fetchone()


def user_exists(user_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_auth_user_exists(%s)", [user_id])
        return bool(cur.fetchone()[0])


def revoke_refresh_token(token_hash: str) -> None:
    with connection.cursor() as cur:
        cur.callproc("sp_auth_revoke_refresh_token", [token_hash])