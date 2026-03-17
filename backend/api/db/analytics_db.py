from django.db import connection


def get_project_analytics():
    with connection.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*) AS total_projects,
                COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_projects,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_projects,
                COUNT(*) FILTER (WHERE status = 'ON_HOLD') AS on_hold_projects
            FROM projects
        """)
        s = cur.fetchone()

        summary = {
            "total_projects": int(s[0] or 0),
            "active_projects": int(s[1] or 0),
            "completed_projects": int(s[2] or 0),
            "on_hold_projects": int(s[3] or 0),
        }

        cur.execute("""
            SELECT
                p.id,
                p.name,
                COUNT(DISTINCT t.id) AS task_count,
                COUNT(DISTINCT CASE WHEN t.status IN ('DONE', 'COMPLETED') THEN t.id END) AS completed_count,
                COUNT(DISTINCT CASE WHEN t.status NOT IN ('DONE', 'COMPLETED') THEN t.id END) AS pending_count,
                COUNT(DISTINCT pm.user_id) AS member_count
            FROM projects p
            LEFT JOIN tasks t ON t.project_id = p.id
            LEFT JOIN project_members pm ON pm.project_id = p.id
            GROUP BY p.id, p.name
            ORDER BY task_count DESC, p.name ASC
        """)

        rows = cur.fetchall()
        by_project = []

        for row in rows:
            task_count = int(row[2] or 0)
            completed_count = int(row[3] or 0)
            progress_percent = round((completed_count / task_count) * 100) if task_count else 0

            by_project.append({
                "project_id": row[0],
                "project_name": row[1],
                "task_count": task_count,
                "completed_count": completed_count,
                "pending_count": int(row[4] or 0),
                "member_count": int(row[5] or 0),
                "progress_percent": progress_percent,
            })

        return {
            "summary": summary,
            "by_project": by_project,
        }