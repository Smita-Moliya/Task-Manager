from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import HasViewPermission, IsAuthenticatedCustom
from api.serializers.task_serializer import (
    TaskCreateSerializer,
    TaskListQuerySerializer,
    TaskStatusUpdateSerializer,
    TaskUpdateSerializer,
)
from api.services.tasks_service import (
    create_task_service,
    delete_task_service,
    get_task_service,
    list_tasks_service,
    my_tasks_service,
    update_my_task_status_service,
    update_task_service,
)


class TasksView(generics.GenericAPIView):
    serializer_class = TaskCreateSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_code = "view_tasks"

    def get(self, request, *args, **kwargs):
        serializer = TaskListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        result = list_tasks_service(
            role=request.role,
            user_id=request.user_id,
            params=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = request.FILES.getlist("files") if request.FILES else []

        result = create_task_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            data=serializer.validated_data,
            files=files,
        )
        return Response(result, status=status.HTTP_201_CREATED)

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_code = "create_task"
        else:
            self.permission_code = "view_tasks"
        return super().get_permissions()


class TaskByIdView(generics.GenericAPIView):
    serializer_class = TaskUpdateSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_tasks"

    def get(self, request, task_id: int, *args, **kwargs):
        result = get_task_service(
            role=request.role,
            user_id=request.user_id,
            task_id=task_id,
        )
        return Response(result, status=status.HTTP_200_OK)

    def put(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_task_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            task_id=task_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def patch(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_task_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            task_id=task_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def delete(self, request, task_id: int, *args, **kwargs):
        result = delete_task_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            task_id=task_id,
        )
        return Response(result, status=status.HTTP_200_OK)

    def get_permissions(self):
        if self.request.method == "GET":
            self.permission_code = "view_tasks"
        elif self.request.method in ("PUT", "PATCH"):
            self.permission_code = "edit_task"
        elif self.request.method == "DELETE":
            self.permission_code = "delete_task"
        return super().get_permissions()


class UpdateMyTaskStatusView(generics.GenericAPIView):
    serializer_class = TaskStatusUpdateSerializer
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "change_own_task_status"

    def put(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_my_task_status_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            task_id=task_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def patch(self, request, task_id: int, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_my_task_status_service(
            current_user=request.user,
            current_user_id=request.user_id,
            role=request.role,
            task_id=task_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)


class MyTasksView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "view_tasks"

    def get(self, request, *args, **kwargs):
        result = my_tasks_service(
            current_user=request.user,
            current_user_id=request.user_id,
        )
        return Response(result, status=status.HTTP_200_OK)