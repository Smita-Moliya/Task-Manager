from rest_framework import generics, status
from rest_framework.response import Response

from api.authentication import CustomJWTAuthentication
from api.permissions import IsAuthenticatedCustom, HasViewPermission
from api.serializers.project_member_serializer import AddProjectMembersSerializer
from api.services.project_member_service import (
    list_project_members_service,
    add_project_members_service,
    remove_project_member_service,
)


class ProjectMemberListCreateView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    serializer_class = AddProjectMembersSerializer
    permission_code = "view_projects"

    def get_permissions(self):
        if self.request.method == "POST":
            self.permission_code = "manage_project_members"
        else:
            self.permission_code = "view_projects"
        return super().get_permissions()

    def get(self, request, project_id):
        result = list_project_members_service(project_id=project_id)
        return Response(result, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = add_project_members_service(
            request=request,
            project_id=project_id,
            data=serializer.validated_data,
        )

        if not result.get("added") and result.get("errors"):
            return Response(result, status=400)

        #  partial success
        if result.get("added") and result.get("errors"):
            return Response(result, status=207)

        #  full success
        return Response(result, status=201)


        return Response(result, status=status.HTTP_201_CREATED)

class ProjectMemberDeleteView(generics.GenericAPIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticatedCustom, HasViewPermission]
    permission_code = "manage_project_members"

    def delete(self, request, project_id, user_id):
        result = remove_project_member_service(
            request=request,
            project_id=project_id,
            user_id=user_id,
        )

        if not result.get("ok"):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result, status=status.HTTP_200_OK)