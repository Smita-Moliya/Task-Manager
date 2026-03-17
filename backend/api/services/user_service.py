from django.db import connection
from api.db import users_db

def user_exists_by_email(email: str) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_user_exists_by_email(%s)", [email])
        return bool(cur.fetchone()[0])

def create_user_returning_id(name: str, email: str, role: str) -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_create_user_returning_id(%s,%s,%s)", [name, email, role])
        return int(cur.fetchone()[0])

def insert_password_invite(user_id: int, token_hash: str) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_insert_password_invite(%s,%s)", [user_id, token_hash])

def users_count() -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_users_count()")
        return int(cur.fetchone()[0])

def list_users_page(limit: int, offset: int):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_list_users_page(%s,%s)", [limit, offset])
        return cur.fetchall()

def get_user_id_by_email(email: str):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_get_user_id_by_email(%s)", [email])
        row = cur.fetchone()
        return row[0] if row and row[0] is not None else None

def mark_active_invites_used(user_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_mark_active_invites_used(%s)", [user_id])

def get_invite_by_token(token_hash: str):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_invite_by_token(%s)", [token_hash])
        return cur.fetchone()

def update_user_password_hash(user_id: int, password_hash: str) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_update_user_password_hash(%s,%s)", [user_id, password_hash])

def mark_invite_used(invite_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_mark_invite_used(%s)", [invite_id])

def user_exists_by_id(user_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_user_exists_by_id(%s)", [user_id])
        return bool(cur.fetchone()[0])

def delete_user_by_id(user_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_delete_user(%s)", [user_id])

def user_has_assigned_tasks(user_id: int) -> bool:
    return users_db.user_has_assigned_tasks(user_id)


def get_user_by_id(user_id: int):
    row = users_db.get_user_by_id(user_id)
    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }


def get_user_by_email(email: str):
    row = users_db.get_user_by_email(email)
    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }


def update_user(user_id: int, name: str, email: str, role: str):
    row = users_db.update_user(user_id, name, email, role)
    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }