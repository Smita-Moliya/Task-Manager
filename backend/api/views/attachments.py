from django.http import FileResponse
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import HasViewPermission, IsAuthenticatedCustom
from api.serializers.attachment_serializer import AttachmentUploadSerializer
from api.services.attachments_service import (
    download_attachment_service,
    list_task_attachments_service,
    upload_task_attachments_service,
)


class DownloadAttachmentView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, att_id: int, *args, **kwargs):
        result = download_attachment_service(request, att_id)
        return FileResponse(
            result["file_handle"],
            as_attachment=True,
            filename=result["original_name"],
        )


class TaskAttachmentsView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    parser_classes = [MultiPartParser, FormParser]
    permission_code = "view_tasks"

    def get(self, request, task_id: int, *args, **kwargs):
        result = list_task_attachments_service(request, task_id)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, task_id: int, *args, **kwargs):
        serializer = AttachmentUploadSerializer(data={"files": request.FILES.getlist("files")})
        serializer.is_valid(raise_exception=True)

        result = upload_task_attachments_service(
            request=request,
            task_id=task_id,
            files=serializer.validated_data["files"],
            duplicate_action=request.POST.get("duplicate_action", ""),
        )

        if result.get("duplicate"):
            return Response(
                {
                    "message": result["message"],
                    "duplicate": True,
                    "conflicts": result["conflicts"],
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "message": result["message"],
                "saved": result["saved"],
            },
            status=status.HTTP_201_CREATED,
        )

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_code = "edit_task"
        else:
            self.permission_code = "view_tasks"
        return super().get_permissions()