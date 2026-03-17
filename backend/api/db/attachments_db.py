from typing import Optional, Tuple, List
from django.db import connection


def get_attachment_by_id(att_id: int) -> Optional[Tuple[int, str, str]]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_task_attachments_get(%s)", [att_id])
        return cur.fetchone()


def list_task_attachments(task_id: int) -> List[tuple]:
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM fn_task_attachments_list(%s)", [task_id])
        return cur.fetchall()


def create_task_attachment(
    task_id: int,
    original_name: str,
    stored_name: str,
    file_path: str,
    mime_type: str
) -> int:
    with connection.cursor() as cur:
        cur.execute(
            "SELECT public.fn_task_attachments_create(%s, %s, %s, %s, %s)",
            [task_id, original_name, stored_name, file_path, mime_type or ""],
        )
        row = cur.fetchone()
        return int(row[0])


def get_attachment_by_task_and_name(task_id: int, original_name: str):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT id, original_name, file_path
            FROM 
            task_attachments
            WHERE task_id = %s
              AND LOWER(original_name) = LOWER(%s)
            ORDER BY id DESC
            LIMIT 1
            """,
            [task_id, original_name],
        )
        return cur.fetchone()


def list_attachment_names(task_id: int) -> List[str]:
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT original_name
            FROM task_attachments
            WHERE task_id = %s
            """,
            [task_id],
        )
        rows = cur.fetchall()
        return [r[0] for r in rows]


def delete_task_attachment(att_id: int) -> None:
    with connection.cursor() as cur:
        cur.execute(
            "DELETE FROM task_attachments WHERE id = %s",
            [att_id],
        )