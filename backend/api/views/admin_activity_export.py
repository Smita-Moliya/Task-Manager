from django.http import HttpResponse
from rest_framework import generics
from rest_framework.renderers import JSONRenderer

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, HasViewPermission
from api.serializers.activity_serializer import AdminActivityExportQuerySerializer
from api.services.activity_export_service import export_activity_logs_service
from api.utils.export_activity import generate_activity_pdf, generate_activity_excel


class AdminActivityExportView(generics.GenericAPIView):
    serializer_class = AdminActivityExportQuerySerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_admin_activity"

    def perform_content_negotiation(self, request, force=False):
        return (JSONRenderer(), JSONRenderer.media_type)

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        filters = serializer.validated_data
        format_type = filters.pop("format", "pdf")

        logs = export_activity_logs_service(filters)

        if format_type == "pdf":
            buffer = generate_activity_pdf(logs)
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="activity_logs.pdf"'
            return response

        # Excel format
        buffer = generate_activity_excel(logs)
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="activity_logs.xlsx"'
        return response