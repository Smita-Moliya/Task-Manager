from django.db import connection
from typing import List


# =========================
# CREATE
# =========================
def create_task_with_project(title, description, status, assigned_by, assigned_to, due_date, project_id):
    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO tasks (
                title, description, status, assigned_by, assigned_to,
                due_date, project_id, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id, title, description, status, assigned_by, assigned_to, due_date, project_id, created_at, updated_at
        """, [title, description, status, assigned_by, assigned_to, due_date, project_id])

        row = cur.fetchone()

        return {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "status": row[3],
            "assigned_by": row[4],
            "assigned_to": row[5],
            "due_date": str(row[6]) if row[6] else None,
            "project_id": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
        }


# =========================
# GET TASK
# =========================
def get_task_by_id(task_id):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.assigned_by,
                t.assigned_to,
                t.due_date,
                t.project_id,
                p.name,
                t.created_at,
                t.updated_at
            FROM tasks t
            LEFT JOIN projects p ON p.id = t.project_id
            WHERE t.id = %s
        """, [task_id])

        row = cur.fetchone()
        if not row:
            return None

        return {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "status": row[3],
            "assigned_by": row[4],
            "assigned_to": row[5],
            "due_date": str(row[6]) if row[6] else None,
            "project_id": row[7],
            "project_name": row[8],
            "created_at": row[9].isoformat() if row[9] else None,
            "updated_at": row[10].isoformat() if row[10] else None,
        }


# =========================
# LIST TASKS
# =========================
def task_list(q="", assigned_to=None, project_id=None, limit=10, offset=0):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.assigned_to,
                u.name,
                t.due_date,
                t.project_id,
                p.name
            FROM tasks t
            LEFT JOIN users u ON u.id = t.assigned_to
            LEFT JOIN projects p ON p.id = t.project_id
            WHERE (%s = '' OR LOWER(t.title) LIKE LOWER(%s) OR LOWER(COALESCE(t.description, '')) LIKE LOWER(%s))
              AND (%s IS NULL OR t.assigned_to = %s)
              AND (%s IS NULL OR t.project_id = %s)
            ORDER BY t.id DESC
            LIMIT %s OFFSET %s
        """, [
            q, f"%{q}%", f"%{q}%",
            assigned_to, assigned_to,
            project_id, project_id,
            limit, offset
        ])

        rows = cur.fetchall()

        return [{
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "status": r[3],
            "assigned_to": r[4],
            "assigned_to_name": r[5],
            "due_date": str(r[6]) if r[6] else None,
            "project_id": r[7],
            "project_name": r[8],
        } for r in rows]


def task_count(q="", assigned_to=None, project_id=None):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*)
            FROM tasks t
            WHERE (%s = '' OR LOWER(t.title) LIKE LOWER(%s) OR LOWER(COALESCE(t.description, '')) LIKE LOWER(%s))
              AND (%s IS NULL OR t.assigned_to = %s)
              AND (%s IS NULL OR t.project_id = %s)
        """, [
            q, f"%{q}%", f"%{q}%",
            assigned_to, assigned_to,
            project_id, project_id
        ])
        return int(cur.fetchone()[0])


# =========================
# USER-SPECIFIC TASKS
# =========================
def list_tasks_user(user_id, limit, offset):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                t.id, t.title, t.description, t.status,
                t.assigned_to, u.name,
                t.due_date, t.project_id, p.name
            FROM tasks t
            LEFT JOIN users u ON u.id = t.assigned_to
            LEFT JOIN projects p ON p.id = t.project_id
            WHERE t.assigned_to = %s
            ORDER BY t.id DESC
            LIMIT %s OFFSET %s
        """, [user_id, limit, offset])

        rows = cur.fetchall()

        return [{
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "status": r[3],
            "assigned_to": r[4],
            "assigned_to_name": r[5],
            "due_date": str(r[6]) if r[6] else None,
            "project_id": r[7],
            "project_name": r[8],
        } for r in rows]


def count_tasks_user(user_id):
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM tasks WHERE assigned_to = %s", [user_id])
        return int(cur.fetchone()[0])


# =========================
# UPDATE (ADMIN)
# =========================
def update_task_admin(task_id, title, description, status, assigned_to, due_date):
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE tasks
            SET title=%s, description=%s, status=%s,
                assigned_to=%s, due_date=%s, updated_at=NOW()
            WHERE id=%s
        """, [title, description, status, assigned_to, due_date, task_id])


def get_task_old_values(task_id):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT title, description, status, assigned_to, due_date
            FROM tasks
            WHERE id = %s
        """, [task_id])
        return cur.fetchone()


# =========================
# USER STATUS UPDATE
# =========================
def get_task_status_for_user(task_id, user_id):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT status
            FROM tasks
            WHERE id=%s AND assigned_to=%s
        """, [task_id, user_id])
        row = cur.fetchone()
        return row[0] if row else None


def user_update_task_status(task_id, user_id, status):
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE tasks
            SET status=%s, updated_at=NOW()
            WHERE id=%s AND assigned_to=%s
        """, [status, task_id, user_id])


# =========================
# DELETE
# =========================
def delete_task(task_id):
    with connection.cursor() as cur:
        cur.execute("DELETE FROM tasks WHERE id=%s", [task_id])


# =========================
# ATTACHMENTS
# =========================
def insert_task_attachment(task_id, original_name, stored_name, path, mime_type):
    with connection.cursor() as cur:
        cur.execute("""
            INSERT INTO task_attachments
            (task_id, original_name, stored_name, path, mime_type, uploaded_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, [task_id, original_name, stored_name, path, mime_type])


def list_attachments_for_tasks(task_ids: List[int]):
    if not task_ids:
        return []

    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, task_id, original_name, mime_type, uploaded_at
            FROM task_attachments
            WHERE task_id = ANY(%s)
        """, [task_ids])
        return cur.fetchall()
    


def list_tasks_for_user(user_id: int):
    query = """
        SELECT
            t.id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            p.name AS project_name,
            u.name AS assigned_to_name
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.assigned_to = %s
        ORDER BY
            CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END,
            t.due_date ASC,
            t.id DESC
    """
    with connection.cursor() as cur:
        cur.execute(query, [user_id])
        columns = [col[0] for col in cur.description]
        rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]    