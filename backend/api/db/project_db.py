from django.db import connection


from django.db import connection

def create_project(name, description, status, priority, start_date, end_date, created_by):
    try:
        with connection.cursor() as cur:
            cur.execute("""
                INSERT INTO projects (
                    name, description, status, priority,
                    start_date, end_date, created_by,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, name, description, status, priority, start_date, end_date, created_by, created_at, updated_at
            """, [name, description, status, priority, start_date, end_date, created_by])

            row = cur.fetchone()
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
    except Exception as e:
        print("PROJECT CREATE ERROR:", str(e))
        raise
    
def get_project_by_id(project_id):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, name, description, status, priority,
                   start_date, end_date, created_by,
                   created_at, updated_at
            FROM projects
            WHERE id = %s
        """, [project_id])
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
        cur.execute("SELECT 1 FROM projects WHERE id = %s", [project_id])
        return cur.fetchone() is not None


def list_projects(q="", status=None):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.description,
                p.status,
                p.priority,
                p.start_date,
                p.end_date,
                p.created_by,
                p.created_at,
                p.updated_at,
                COUNT(DISTINCT pm.user_id) AS member_count,
                COUNT(DISTINCT t.id) AS task_count,
                COUNT(DISTINCT CASE WHEN t.status IN ('DONE', 'COMPLETED') THEN t.id END) AS completed_count,
                COUNT(DISTINCT CASE WHEN t.status NOT IN ('DONE', 'COMPLETED') THEN t.id END) AS pending_count
            FROM projects p
            LEFT JOIN project_members pm ON pm.project_id = p.id
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE (%s = '' OR LOWER(p.name) LIKE LOWER(%s) OR LOWER(COALESCE(p.description, '')) LIKE LOWER(%s))
              AND (%s IS NULL OR p.status = %s)
            GROUP BY p.id
            ORDER BY p.id DESC
        """, [q, f"%{q}%", f"%{q}%", status, status])

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
                "member_count": row[10],
                "task_count": row[11],
                "completed_count": row[12],
                "pending_count": row[13],
            })
        return out
    
def update_project(project_id, name, description, status, priority, start_date, end_date):
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE projects
            SET
                name = %s,
                description = %s,
                status = %s,
                priority = %s,
                start_date = %s,
                end_date = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, name, description, status, priority, start_date, end_date, created_by, created_at, updated_at
        """, [name, description, status, priority, start_date, end_date, project_id])
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
        cur.execute("DELETE FROM projects WHERE id = %s", [project_id])
        return cur.rowcount > 0


def project_task_count(project_id):
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM tasks WHERE project_id = %s", [project_id])
        return int(cur.fetchone()[0])


def get_project_summary(project_id):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                p.id,
                p.name,
                COUNT(DISTINCT pm.user_id) AS member_count,
                COUNT(DISTINCT t.id) AS task_count,
                COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.id END) AS completed_count,
                COUNT(DISTINCT CASE WHEN t.status = 'PENDING' THEN t.id END) AS pending_count,
                COUNT(DISTINCT CASE
                    WHEN t.due_date IS NOT NULL
                     AND t.due_date < CURRENT_DATE
                     AND t.status <> 'COMPLETED'
                    THEN t.id END
                ) AS overdue_count
            FROM projects p
            LEFT JOIN project_members pm ON pm.project_id = p.id
            LEFT JOIN tasks t ON t.project_id = p.id
            WHERE p.id = %s
            GROUP BY p.id, p.name
        """, [project_id])
        row = cur.fetchone()
        if not row:
            return None
        return {
            "project_id": row[0],
            "project_name": row[1],
            "member_count": row[2],
            "task_count": row[3],
            "completed_count": row[4],
            "pending_count": row[5],
            "overdue_count": row[6],
        }