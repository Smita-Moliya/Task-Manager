# api/views/attachments.py
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt

from api.utils.permissions import ensure_task_access
from api.utils.decorators import require_methods, require_auth
from api.utils.activity import log_activity, ATTACHMENT_UPLOADED

from api.services import attachments_service
from api.serializers.attachment_serializer import AttachmentUploadSerializer


@csrf_exempt
@require_methods(["GET"])
@require_auth
def download_attachment(request, att_id: int):
    row = attachments_service.get_attachment_info(att_id)

    if not row:
        return JsonResponse({"message": "File not found"}, status=404)

    task_id = int(row["task_id"])
    err = ensure_task_access(request, task_id)
    if err:
        return err

    if not row["file_exists"]:
        return JsonResponse({"message": "File missing on server"}, status=404)

    return FileResponse(
        row["file_handle"],
        as_attachment=True,
        filename=row["original_name"],
    )


@csrf_exempt
@require_methods(["GET", "POST"])
@require_auth
def task_attachments(request, task_id: int):
    err = ensure_task_access(request, task_id)
    if err:
        return err

    if request.method == "GET":
        attachments = attachments_service.list_attachments(task_id)
        return JsonResponse({"attachments": attachments}, status=200)

    if not request.content_type or not request.content_type.startswith("multipart/form-data"):
        return JsonResponse({"message": "multipart/form-data required"}, status=400)

    files = request.FILES.getlist("files")

    serializer = AttachmentUploadSerializer(data={"files": files})
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    files = serializer.validated_data["files"]
    duplicate_action = (request.POST.get("duplicate_action") or "").strip().lower()

    try:
        result = attachments_service.upload_attachments(
            task_id=task_id,
            files=files,
            duplicate_action=duplicate_action,
        )

        if result["duplicate"]:
            return JsonResponse(
                {
                    "message": "File already exists. Do you want to keep both files or replace the existing one?",
                    "duplicate": True,
                    "conflicts": result["conflicts"],
                },
                status=409,
            )

        saved = result["saved"]
        names = result["names"]

        log_activity(
            task_id=task_id,
            actor_id=request.user_id,
            action=ATTACHMENT_UPLOADED,
            message=f"{len(names)} attachment(s) uploaded",
            meta={"files": names, "saved": saved},
        )

        return JsonResponse({"message": "Uploaded ✅", "saved": saved}, status=201)

    except Exception as e:
        print("UPLOAD FAILED EX:", repr(e))
        return JsonResponse({"message": "Upload failed", "detail": str(e)}, status=400)