from rest_framework import serializers


class TaskListQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=10)
    q = serializers.CharField(required=False, allow_blank=True, default="")
    assigned_to = serializers.IntegerField(required=False)
    project_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        attrs["q"] = (attrs.get("q") or "").strip()
        return attrs