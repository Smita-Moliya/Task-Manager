from django.db import connection


def add_project_member(project_id, user_id, member_role="MEMBER"):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_add_project_member(%s, %s, %s)",
            [project_id, user_id, member_role],
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "project_id": row[1],
            "user_id": row[2],
            "member_role": row[3],
            "added_at": row[4].isoformat() if row[4] else None,
        }


def list_project_members(project_id):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_list_project_members(%s)",
            [project_id],
        )
        rows = cur.fetchall()
        return [
            {
                "id": row[0],
                "project_id": row[1],
                "user_id": row[2],
                "member_role": row[3],
                "added_at": row[4].isoformat() if row[4] else None,
                "name": row[5],
                "email": row[6],
            }
            for row in rows
        ]


def is_user_in_project(project_id, user_id):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_is_user_in_project(%s, %s)",
            [project_id, user_id],
        )
        row = cur.fetchone()
        return bool(row[0]) if row else False


def remove_project_member(project_id, user_id):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_remove_project_member(%s, %s)",
            [project_id, user_id],
        )
        row = cur.fetchone()
        return bool(row[0]) if row else False