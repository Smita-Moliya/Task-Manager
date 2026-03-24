from django.db import connection


def list_activity_logs_for_export_db(q=None, task_id=None, actor_id=None, action=None):
    if q == "": q = None
    if action == "": action = None
    
    query = "SELECT * FROM fn_list_activity_logs_for_export(%s, %s, %s, %s)"
    params = [q, task_id, actor_id, action]

    with connection.cursor() as cur:
        cur.execute(query, params)
        columns = [col[0] for col in cur.description]
        rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]