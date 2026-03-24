from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import HasViewPermission, IsAuthenticatedCustom
from api.serializers.task_activity_serializer import TaskActivityQuerySerializer
from api.services.task_activity_service import (
    get_my_activity_service,
    get_task_activity_service,
)
from api.db import activity_db
from api.utils.export_activity import generate_activity_pdf, generate_activity_excel


class TaskActivityView(generics.GenericAPIView):
    serializer_class = TaskActivityQuerySerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_admin_activity"

    def get(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        result = get_task_activity_service(
            role=request.role,
            filters=serializer.validated_data,
            task_id=task_id,
        )
        return Response(result, status=status.HTTP_200_OK)


class MyActivityView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, *args, **kwargs):
        result = get_my_activity_service(request.user_id)
        return Response(result, status=status.HTTP_200_OK)


class MyActivityExportView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def perform_content_negotiation(self, request, force=False):
        return (JSONRenderer(), JSONRenderer.media_type)

    def get(self, request, *args, **kwargs):
        format_type = request.query_params.get("format", "pdf")
        
        rows = activity_db.user_activity_list(request.user_id, 10000)
        logs = []
        for row in rows:
            meta = row[7] or {}
            logs.append(
                {
                    "id": row[0],
                    "task_id": row[1],
                    "task_title": row[2] or "",
                    "actor_id": row[3],
                    "actor_name": row[4] or "Unknown",
                    "action": row[5],
                    "message": row[6] or "",
                    "meta": meta,
                    "created_at": row[8].isoformat() if row[8] else None,
                }
            )

        if format_type == "pdf":
            buffer = generate_activity_pdf(logs)
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="my_activities.pdf"'
            return response

        buffer = generate_activity_excel(logs)
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="my_activities.xlsx"'
        return response