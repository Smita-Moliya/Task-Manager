from rest_framework import serializers


class TaskCommentCreateSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, allow_blank=False)

    def validate_comment(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment is required")
        return value