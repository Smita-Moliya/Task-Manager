from rest_framework import generics, status
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, HasViewPermission
from api.serializers.project_serializer import (
    ProjectCreateUpdateSerializer,
    ProjectListQuerySerializer,
)
from api.services.project_service import (
    create_project_service,
    list_projects_service,
    get_project_detail_service,
    update_project_service,
    delete_project_service,
)


class ProjectListCreateView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    serializer_class = ProjectCreateUpdateSerializer
    permission_code = "view_projects"

    def get(self, request):
        serializer = ProjectListQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        result = list_projects_service(filters=serializer.validated_data)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request):
        self.permission_code = "create_project"

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = create_project_service(
            request=request,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_201_CREATED)


class ProjectDetailView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    serializer_class = ProjectCreateUpdateSerializer
    permission_code = "view_projects"

    def get(self, request, project_id):
        result = get_project_detail_service(project_id=project_id)
        return Response(result, status=status.HTTP_200_OK)

    def put(self, request, project_id):
        self.permission_code = "edit_project"

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = update_project_service(
            request=request,
            project_id=project_id,
            data=serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def patch(self, request, project_id):
        self.permission_code = "edit_project"

        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        existing = get_project_detail_service(project_id=project_id)["project"]

        merged_data = {
            "name": serializer.validated_data.get("name", existing.get("name")),
            "description": serializer.validated_data.get("description", existing.get("description")),
            "status": serializer.validated_data.get("status", existing.get("status")),
            "priority": serializer.validated_data.get("priority", existing.get("priority")),
            "start_date": serializer.validated_data.get("start_date", existing.get("start_date")),
            "end_date": serializer.validated_data.get("end_date", existing.get("end_date")),
        }

        validated_serializer = self.get_serializer(data=merged_data)
        validated_serializer.is_valid(raise_exception=True)

        result = update_project_service(
            request=request,
            project_id=project_id,
            data=validated_serializer.validated_data,
        )
        return Response(result, status=status.HTTP_200_OK)

    def delete(self, request, project_id):
        self.permission_code = "delete_project"

        result = delete_project_service(
            request=request,
            project_id=project_id,
        )
        return Response(result, status=status.HTTP_200_OK)