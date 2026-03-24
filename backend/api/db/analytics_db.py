from django.db import connection


def get_project_analytics():
    with connection.cursor() as cur:
        cur.execute("SELECT fn_get_project_analytics()")
        row = cur.fetchone()
        return row[0] if row else {"summary": {}, "by_project": []}