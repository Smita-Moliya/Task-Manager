from rest_framework import serializers


class ProjectMemberItemSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    member_role = serializers.ChoiceField(
        choices=["LEAD", "DEVELOPER", "TESTER", "MEMBER"],
        required=False,
        default="MEMBER",
    )


class AddProjectMembersSerializer(serializers.Serializer):
    members = ProjectMemberItemSerializer(many=True)

    def validate_members(self, value):
        if not value:
            raise serializers.ValidationError("This list may not be empty.")
        return value