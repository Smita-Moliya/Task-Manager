from django.db import connection, IntegrityError


def add_project_member(project_id, user_id, member_role="MEMBER"):
    print("=== ADD PROJECT MEMBER DB HIT ===")
    print("INSERT VALUES:", project_id, user_id, member_role)

    try:
        with connection.cursor() as cur:
            cur.execute("""
                INSERT INTO project_members (project_id, user_id, member_role, added_at)
                VALUES (%s, %s, %s, NOW())
                RETURNING id, project_id, user_id, member_role, added_at
            """, [project_id, user_id, member_role])

            row = cur.fetchone()
            return {
                "id": row[0],
                "project_id": row[1],
                "user_id": row[2],
                "member_role": row[3],
                "added_at": row[4].isoformat() if row[4] else None,
            }
    except Exception as e:
        print("ADD PROJECT MEMBER DB ERROR:", repr(e))
        raise

def list_project_members(project_id):
    print("=== LIST PROJECT MEMBERS DB HIT ===")
    with connection.cursor() as cur:
        cur.execute("""
            SELECT pm.id, pm.project_id, pm.user_id, pm.member_role, pm.added_at,
                   u.name, u.email
            FROM project_members pm
            JOIN users u ON u.id = pm.user_id
            WHERE pm.project_id = %s
            ORDER BY pm.added_at ASC
        """, [project_id])
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
    print("=== IS USER IN PROJECT DB HIT ===")
    with connection.cursor() as cur:
        cur.execute("""
            SELECT 1 FROM project_members
            WHERE project_id = %s AND user_id = %s
            LIMIT 1
        """, [project_id, user_id])
        return cur.fetchone() is not None 
    

def remove_project_member(project_id, user_id):
    print("=== REMOVE PROJECT MEMBER DB HIT ===")
    print("DELETE VALUES:", project_id, user_id)

    with connection.cursor() as cur:
        cur.execute("""
            DELETE FROM project_members
            WHERE project_id = %s AND user_id = %s
        """, [project_id, user_id])

        return cur.rowcount > 0