from rest_framework import serializers


class TaskActivityQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=30)

    q = serializers.CharField(required=False, allow_blank=True, default="")
    actor_id = serializers.IntegerField(required=False, min_value=1, allow_null=True)
    action = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_q(self, value):
        return value.strip()

    def validate_action(self, value):
        return value.strip()
    
    def validate_actor_id(self, value):
        return value

    def to_internal_value(self, data):
        if hasattr(data, "dict"):
            data = data.dict()
        else:
            data = dict(data)

        val = data.get("actor_id")
        if val in ("", None, "null", "undefined"):
            data["actor_id"] = None

        return super().to_internal_value(data)