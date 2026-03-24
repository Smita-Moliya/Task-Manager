from django.db import connection


def get_admin_dashboard_db():
    with connection.cursor() as cur:
        cur.execute("SELECT fn_admin_dashboard();")
        row = cur.fetchone()

    if not row:
        return {}

    data = row[0]
    return data if isinstance(data, dict) else {}