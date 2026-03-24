import json
from django.db import connection

ALLOWED_ROLES = {"ADMIN", "USER"}


def fetch_role_page_access():
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_fetch_role_page_access()")
        rows = cur.fetchall()

    result = {"ADMIN": [], "USER": []}
    for role_name, page_key, allowed in rows:
        result[role_name].append({
            "page_key": page_key,
            "allowed": bool(allowed),
        })
    return result


def fetch_page_access_for_role(role_name: str):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT * FROM fn_fetch_page_access_for_role(%s)",
            [role_name]
        )
        rows = cur.fetchall()

    return [
        {"page_key": page_key, "allowed": bool(allowed)}
        for page_key, allowed in rows
    ]


def replace_role_page_access(role_name: str, pages: list[dict]):
    with connection.cursor() as cur:
        cur.execute(
            "CALL sp_replace_role_page_access(%s, %s::jsonb)",
            [role_name, json.dumps(pages)]
        )


def has_page_access(role_name: str, page_key: str) -> bool:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT fn_has_page_access(%s, %s)",
            [role_name, page_key]
        )
        row = cur.fetchone()

    return bool(row[0]) if row else False