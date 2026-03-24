from rest_framework import generics, status
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom
from api.services.user_project_service import (
    list_user_projects_service,
    get_user_project_detail_service,
    list_user_project_tasks_service,
    list_user_project_members_service,
    list_user_project_activity_service,
)


class ListUserProjectsView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, *args, **kwargs):
        result = list_user_projects_service(request.user_id)
        return Response(result, status=status.HTTP_200_OK)


class UserProjectDetailView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, project_id: int, *args, **kwargs):
        result = get_user_project_detail_service(project_id, request.user_id)
        return Response(result, status=status.HTTP_200_OK)


class UserProjectTasksView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, project_id: int, *args, **kwargs):
        result = list_user_project_tasks_service(project_id, request.user_id)
        return Response(result, status=status.HTTP_200_OK)


class UserProjectMembersView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, project_id: int, *args, **kwargs):
        result = list_user_project_members_service(project_id, request.user_id)
        return Response(result, status=status.HTTP_200_OK)


class UserProjectActivityView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, project_id: int, *args, **kwargs):
        result = list_user_project_activity_service(project_id, request.user_id)
        return Response(result, status=status.HTTP_200_OK)