from django.db import connection

def get_user_email_name(user_id: int):
    with connection.cursor() as cur:
        cur.execute("SELECT email, name FROM users WHERE id=%s;", [user_id])
        row = cur.fetchone()
    if not row:
        return None
    return {"email": row[0], "name": row[1]}


def user_has_assigned_tasks(user_id: int) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT EXISTS(SELECT 1 FROM tasks WHERE assigned_to = %s)",
            [user_id],
        )
        return cur.fetchone()[0]
    

def get_user_by_id(user_id: int):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, name, email, role
            FROM users
            WHERE id = %s
        """, [user_id])
        return cur.fetchone()


def get_user_by_email(email: str):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, name, email, role
            FROM users
            WHERE LOWER(email) = LOWER(%s)
        """, [email])
        return cur.fetchone()


def update_user(user_id: int, name: str, email: str, role: str):
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE users
            SET
                name = %s,
                email = %s,
                role = %s
            WHERE id = %s
            RETURNING id, name, email, role
        """, [name, email, role, user_id])
        return cur.fetchone()