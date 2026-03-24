import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, HasViewPermission
from api.services.admin_dashboard_service import get_admin_dashboard_service

logger = logging.getLogger(__name__)


class AdminDashboardView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_dashboard"

    def get(self, request, *args, **kwargs):
        try:
            data = get_admin_dashboard_service()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Admin dashboard load failed")

            return Response(
                {
                    "message": "Failed to load admin dashboard",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )