from django.db import connection


def create_project(name, description, status, priority, start_date, end_date, created_by):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_create_project(%s, %s, %s, %s, %s, %s, %s)",
            [name, description, status, priority, start_date, end_date, created_by],
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "status": row[3],
            "priority": row[4],
            "start_date": str(row[5]) if row[5] else None,
            "end_date": str(row[6]) if row[6] else None,
            "created_by": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
        }


def get_project_by_id(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_project_by_id(%s)", [project_id])
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "status": row[3],
            "priority": row[4],
            "start_date": str(row[5]) if row[5] else None,
            "end_date": str(row[6]) if row[6] else None,
            "created_by": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
        }


def project_exists(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_project_exists(%s)", [project_id])
        row = cur.fetchone()
        return bool(row[0]) if row else False


def list_projects(q="", status=None):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_list_projects(%s, %s)", [q, status])
        rows = cur.fetchall()

        out = []
        for row in rows:
            out.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "start_date": str(row[5]) if row[5] else None,
                "end_date": str(row[6]) if row[6] else None,
                "created_by": row[7],
                "created_at": row[8].isoformat() if row[8] else None,
                "updated_at": row[9].isoformat() if row[9] else None,
                "member_count": int(row[10] or 0),
                "task_count": int(row[11] or 0),
                "completed_count": int(row[12] or 0),
                "pending_count": int(row[13] or 0),
            })
        return out


def update_project(project_id, name, description, status, priority, start_date, end_date):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_update_project(%s, %s, %s, %s, %s, %s, %s)",
            [project_id, name, description, status, priority, start_date, end_date],
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "status": row[3],
            "priority": row[4],
            "start_date": str(row[5]) if row[5] else None,
            "end_date": str(row[6]) if row[6] else None,
            "created_by": row[7],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
        }


def delete_project(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_delete_project(%s)", [project_id])
        row = cur.fetchone()
        return bool(row[0]) if row else False


def project_task_count(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT fn_project_task_count(%s)", [project_id])
        row = cur.fetchone()
        return int(row[0] or 0) if row else 0


def get_project_summary(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_get_project_summary(%s)", [project_id])
        row = cur.fetchone()
        if not row:
            return None
        return {
            "project_id": row[0],
            "project_name": row[1],
            "member_count": int(row[2] or 0),
            "task_count": int(row[3] or 0),
            "completed_count": int(row[4] or 0),
            "pending_count": int(row[5] or 0),
            "overdue_count": int(row[6] or 0),
        }