from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, HasViewPermission
from api.serializers.activity_serializer import AdminActivityQuerySerializer
from api.services.activity_service import get_admin_activity_service


class AdminActivityView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    serializer_class = AdminActivityQuerySerializer
    permission_code = "view_admin_activity"

    def get(self, request):
        if request.role not in ("ADMIN", "SUPERUSER"):
            raise PermissionDenied("Forbidden")

        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        result = get_admin_activity_service(
            request=request,
            filters=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)