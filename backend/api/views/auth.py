from rest_framework import generics
from rest_framework.response import Response

from api.services.auth_service import (
    login_service,
    refresh_access_service,
    logout_service,
)
from api.serializers.auth_serializer import (
    LoginSerializer,
    RefreshTokenSerializer,
)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        status_code, payload = login_service(data["email"], data["password"])
        return Response(payload, status=status_code)


class RefreshAccessTokenView(generics.GenericAPIView):
    serializer_class = RefreshTokenSerializer
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh = serializer.validated_data["refresh"]
        status_code, payload = refresh_access_service(refresh)
        return Response(payload, status=status_code)


class LogoutView(generics.GenericAPIView):
    serializer_class = RefreshTokenSerializer
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_raw = serializer.validated_data["refresh"]
        status_code, payload = logout_service(refresh_raw)
        return Response(payload, status=status_code)