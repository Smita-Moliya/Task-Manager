from django.db import connection


def user_exists_by_email(email) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_user_exists_by_email(%s)", [email])
        row = cur.fetchone()
    return bool(row[0]) if row else False


def user_exists_by_id(user_id) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_user_exists_by_id(%s)", [user_id])
        row = cur.fetchone()
    return bool(row[0]) if row else False


def create_user_returning_id(name, email, role) -> int:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_create_user_returning_id(%s, %s, %s)",
            [name, email, role],
        )
        row = cur.fetchone()
    return int(row[0])


def insert_password_invite(user_id, token_hash) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_insert_password_invite(%s, %s)", [user_id, token_hash])


def mark_active_invites_used(user_id) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_mark_active_invites_used(%s)", [user_id])


def get_invite_by_token(token_hash):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_invite_by_token(%s)", [token_hash])
        return cur.fetchone()


def mark_invite_used(invite_id) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_mark_invite_used(%s)", [invite_id])


def update_user_password_hash(user_id, password_hash) -> None:
    with connection.cursor() as cur:
        cur.execute(
            "CALL sp_update_user_password_hash(%s, %s)",
            [user_id, password_hash],
        )


def get_user_id_by_email(email):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_get_user_id_by_email(%s)", [email])
        row = cur.fetchone()
    return row[0] if row and row[0] is not None else None

def get_user_email_name(user_id):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_user_email_name(%s)", [user_id])
        row = cur.fetchone()

    if not row:
        return None

    return {
        "email": row[0],
        "name": row[1],
    }

def get_user_by_id(user_id):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_user_by_id(%s)", [user_id])
        row = cur.fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }


def get_user_by_email(email):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_user_by_email(%s)", [email])
        row = cur.fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }


def users_count(role) -> int:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_users_count(%s)", [role])
        row = cur.fetchone()
    return int(row[0]) if row else 0


def list_users_page(limit, offset, role):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_list_users_page(%s, %s, %s)",
            [limit, offset, role],
        )
        return cur.fetchall()


def update_user(user_id, name, email, role):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_update_user(%s, %s, %s, %s)",
            [user_id, name, email, role],
        )
        row = cur.fetchone()

    if not row:
        return None

    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
    }


def delete_user_by_id(user_id) -> None:
    with connection.cursor() as cur:
        cur.execute("CALL sp_delete_user(%s)", [user_id])


def user_has_assigned_tasks(user_id) -> bool:
    with connection.cursor() as cur:
        cur.execute("SELECT fn_user_has_assigned_tasks(%s)", [user_id])
        row = cur.fetchone()
    return bool(row[0]) if row else False