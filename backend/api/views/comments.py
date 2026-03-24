from rest_framework import generics, status
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import HasViewPermission, IsAuthenticatedCustom
from api.serializers.comment_serializer import TaskCommentCreateSerializer
from api.services.comments_service import (
    add_task_comment_service,
    list_task_comments_service,
)
from api.services.me_service import get_me_attachments, get_me_comments


class TaskCommentsView(generics.GenericAPIView):
    serializer_class = TaskCommentCreateSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_tasks"

    def get(self, request, task_id: int, *args, **kwargs):
        result = list_task_comments_service(request, task_id)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = add_task_comment_service(
            request=request,
            task_id=task_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_201_CREATED)


class MeAttachmentsView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, *args, **kwargs):
        result = get_me_attachments(request.role, request.user_id)
        return Response({"attachments": result}, status=status.HTTP_200_OK)


class MeCommentsView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, *args, **kwargs):
        result = get_me_comments(request.role, request.user_id)
        return Response({"comments": result}, status=status.HTTP_200_OK)