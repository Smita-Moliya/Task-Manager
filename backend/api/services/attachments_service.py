import os
import uuid
from typing import List, Dict, Any, Optional
from django.conf import settings
from api.db import attachments_db


def get_attachment_info(att_id: int) -> Optional[Dict[str, Any]]:
    row = attachments_db.get_attachment_by_id(att_id)
    if not row:
        return None

    task_id, file_path, original_name = row

    if not file_path:
        return {
            "task_id": task_id,
            "file_path": None,
            "original_name": original_name,
            "file_exists": False,
            "file_handle": None,
        }

    abs_path = file_path
    if not os.path.isabs(file_path):
        abs_path = os.path.join(settings.MEDIA_ROOT, file_path)

    file_exists = os.path.isfile(abs_path)
    file_handle = None

    if file_exists:
        try:
            file_handle = open(abs_path, "rb")
        except OSError:
            file_exists = False

    return {
        "task_id": task_id,
        "file_path": abs_path,
        "original_name": original_name,
        "file_exists": file_exists,
        "file_handle": file_handle,
    }


def list_attachments(task_id: int) -> List[Dict[str, Any]]:
    rows = attachments_db.list_task_attachments(task_id)

    out = []
    for a_id, t_id, original_name, mime_type, uploaded_at in rows:
        out.append({
            "id": a_id,
            "task_id": t_id,
            "original_name": original_name,
            "mime_type": mime_type,
            "uploaded_at": str(uploaded_at) if uploaded_at else None,
            "download_url": f"/api/attachments/{a_id}/download/",
        })
    return out


def _build_unique_name(task_id: int, original_name: str) -> str:
    """
    Creates 'file (2).pdf', 'file (3).pdf' style names if user chooses keep both.
    """
    existing_names = attachments_db.list_attachment_names(task_id)
    existing_lower = {name.lower() for name in existing_names}

    if original_name.lower() not in existing_lower:
        return original_name

    base, ext = os.path.splitext(original_name)
    counter = 2

    while True:
        candidate = f"{base} ({counter}){ext}"
        if candidate.lower() not in existing_lower:
            return candidate
        counter += 1


def _save_single_attachment(task_id: int, upload_file, original_name_to_store: str) -> Dict[str, Any]:
    folder = os.path.join(settings.MEDIA_ROOT, "task_attachments", str(task_id))
    os.makedirs(folder, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}_{original_name_to_store}"
    full_path = os.path.join(folder, stored_name)

    with open(full_path, "wb+") as dest:
        for chunk in upload_file.chunks():
            dest.write(chunk)

    mime = getattr(upload_file, "content_type", "") or ""
    rel_path = os.path.join("task_attachments", str(task_id), stored_name)

    new_id = attachments_db.create_task_attachment(
        task_id=task_id,
        original_name=original_name_to_store,
        stored_name=stored_name,
        file_path=rel_path,
        mime_type=mime,
    )

    return {
        "id": new_id,
        "original_name": original_name_to_store,
        "download_url": f"/api/attachments/{new_id}/download/",
    }


def upload_attachments(task_id: int, files, duplicate_action: str = "") -> Dict[str, Any]:
    saved: List[Dict[str, Any]] = []
    names: List[str] = []
    conflicts: List[Dict[str, Any]] = []

    duplicate_action = (duplicate_action or "").strip().lower()

    for f in files:
        existing = attachments_db.get_attachment_by_task_and_name(task_id, f.name)

        if existing:
            existing_id, existing_original_name, existing_file_path = existing

            if duplicate_action not in {"keep", "replace"}:
                conflicts.append({
                    "existing_attachment_id": existing_id,
                    "file_name": existing_original_name,
                })
                continue

            if duplicate_action == "replace":
                attachments_db.delete_task_attachment(existing_id)

                if existing_file_path:
                    abs_old_path = existing_file_path
                    if not os.path.isabs(abs_old_path):
                        abs_old_path = os.path.join(settings.MEDIA_ROOT, abs_old_path)

                    if os.path.isfile(abs_old_path):
                        try:
                            os.remove(abs_old_path)
                        except OSError:
                            pass

                saved_item = _save_single_attachment(task_id, f, f.name)
                saved.append(saved_item)
                names.append(saved_item["original_name"])
                continue

            if duplicate_action == "keep":
                unique_name = _build_unique_name(task_id, f.name)
                saved_item = _save_single_attachment(task_id, f, unique_name)
                saved.append(saved_item)
                names.append(saved_item["original_name"])
                continue

        saved_item = _save_single_attachment(task_id, f, f.name)
        saved.append(saved_item)
        names.append(saved_item["original_name"])

    if conflicts:
        return {
            "duplicate": True,
            "conflicts": conflicts,
            "saved": [],
            "names": [],
        }

    return {
        "duplicate": False,
        "conflicts": [],
        "saved": saved,
        "names": names,
    }