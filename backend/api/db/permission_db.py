from django.db import connection


def list_permission_codes_for_user(user_id: int):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_list_permission_codes_for_user(%s)",
            [user_id]
        )
        return cur.fetchall()


def get_permission_id_by_code(code: str):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_get_permission_id_by_code(%s)",
            [code]
        )
        row = cur.fetchone()
        return row[0] if row else None


def upsert_user_permission(user_id: int, permission_code: str, allowed: bool, granted_by: int):
    with connection.cursor() as cur:
        cur.execute(
            "CALL sp_upsert_user_permission(%s, %s, %s, %s)",
            [user_id, permission_code, allowed, granted_by]
        )


def list_page_access():
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_list_page_access()")
        return cur.fetchall()