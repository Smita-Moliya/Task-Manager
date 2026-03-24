import os
import uuid
from typing import Dict, List

from django.conf import settings
from rest_framework.exceptions import NotFound
from api.db import attachments_db
from api.exceptions import BadRequestError
from api.services.activity_logger_service import log_activity_service
from api.services.tasks_service import ensure_task_access_service
from api.utils.activity import ATTACHMENT_UPLOADED


def download_attachment_service(request, att_id: int) -> Dict[str, Any]:
    row = attachments_db.get_attachment_by_id(att_id)
    if not row:
        raise NotFound("File not found")

    task_id, file_path, original_name = row

    ensure_task_access_service(request.role, request.user_id, int(task_id))

    if not file_path:
        raise NotFound("File missing on server")

    abs_path = file_path
    if not os.path.isabs(file_path):
        abs_path = os.path.join(settings.MEDIA_ROOT, file_path)

    if not os.path.isfile(abs_path):
        raise NotFound("File missing on server")

    try:
        file_handle = open(abs_path, "rb")
    except OSError:
        raise NotFound("File missing on server")

    return {
        "file_handle": file_handle,
        "original_name": original_name,
    }


def list_task_attachments_service(request, task_id: int) -> Dict[str, Any]:
    ensure_task_access_service(request.role, request.user_id, task_id)

    rows = attachments_db.list_task_attachments(task_id)

    attachments = []
    for a_id, t_id, original_name, mime_type, uploaded_at in rows:
        attachments.append(
            {
                "id": a_id,
                "task_id": t_id,
                "original_name": original_name,
                "mime_type": mime_type,
                "uploaded_at": str(uploaded_at) if uploaded_at else None,
                "download_url": f"/api/attachments/{a_id}/download/",
            }
        )

    return {"attachments": attachments}


def upload_task_attachments_service(
    request,
    task_id: int,
    files,
    duplicate_action: str = "",
) -> Dict[str, Any]:
    ensure_task_access_service(request.role, request.user_id, task_id)

    if not files:
        raise BadRequestError({"message": "Please select at least one file."})

    duplicate_action = (duplicate_action or "").strip().lower()

    saved: List[Dict[str, Any]] = []
    names: List[str] = []
    conflicts: List[Dict[str, Any]] = []

    for file_obj in files:
        existing = attachments_db.get_attachment_by_task_and_name(task_id, file_obj.name)

        if existing:
            existing_id, existing_original_name, existing_file_path = existing

            if duplicate_action not in {"keep", "replace"}:
                conflicts.append(
                    {
                        "existing_attachment_id": existing_id,
                        "file_name": existing_original_name,
                    }
                )
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

                saved_item = _save_single_attachment(task_id, file_obj, file_obj.name)
                saved.append(saved_item)
                names.append(saved_item["original_name"])
                continue

            if duplicate_action == "keep":
                unique_name = _build_unique_name(task_id, file_obj.name)
                saved_item = _save_single_attachment(task_id, file_obj, unique_name)
                saved.append(saved_item)
                names.append(saved_item["original_name"])
                continue

        saved_item = _save_single_attachment(task_id, file_obj, file_obj.name)
        saved.append(saved_item)
        names.append(saved_item["original_name"])

    if conflicts:
        return {
            "message": "File already exists. Do you want to keep both files or replace the existing one?",
            "duplicate": True,
            "conflicts": conflicts,
        }

    log_activity_service(
        task_id=task_id,
        actor_id=request.user_id,
        action=ATTACHMENT_UPLOADED,
        message=f"{len(names)} attachment(s) uploaded",
        meta={"files": names, "saved": saved},
    )

    return {
        "message": "Uploaded successfully ✅",
        "saved": saved,
        "duplicate": False,
        "conflicts": [],
    }


def _build_unique_name(task_id: int, original_name: str) -> str:
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