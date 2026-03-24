from rest_framework import generics, status
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, IsAdminOrSuperUserCustom
from api.serializers.user_serializer import (
    CreateUserSerializer,
    SendResetLinkSerializer,
    SetPasswordFromTokenSerializer,
    UserUpdateSerializer,
)
from api.services.user_service import (
    create_user_service,
    list_users_service,
    send_reset_link_service,
    set_password_from_token_service,
    delete_user_service,
    update_user_service,
)


class CreateUserView(generics.GenericAPIView):
    serializer_class = CreateUserSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAdminOrSuperUserCustom]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_user_service(serializer.validated_data)
        return Response(result, status=status.HTTP_201_CREATED)


class ListUsersView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAdminOrSuperUserCustom]

    def get(self, request, *args, **kwargs):
        result = list_users_service(request.query_params)
        return Response(result, status=status.HTTP_200_OK)


class SendResetLinkView(generics.GenericAPIView):
    serializer_class = SendResetLinkSerializer
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = send_reset_link_service(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)


class SetPasswordFromTokenView(generics.GenericAPIView):
    serializer_class = SetPasswordFromTokenSerializer
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = set_password_from_token_service(serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)


class DeleteUserView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAdminOrSuperUserCustom]

    def delete(self, request, user_id: int, *args, **kwargs):
        result = delete_user_service(
            current_user=request.user,
            current_user_id=request.user_id,
            target_user_id=user_id,
        )
        return Response(result, status=status.HTTP_200_OK)


class UpdateUserView(generics.GenericAPIView):
    serializer_class = UserUpdateSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAdminOrSuperUserCustom]

    def put(self, request, user_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_user_service(
            current_user=request.user,
            current_user_id=request.user_id,
            target_user_id=user_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)