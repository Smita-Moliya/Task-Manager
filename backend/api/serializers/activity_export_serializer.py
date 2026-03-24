from rest_framework import serializers


class ActivityExportSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=["pdf", "excel"])
    q = serializers.CharField(required=False, allow_blank=True)
    task_id = serializers.IntegerField(required=False)
    actor_id = serializers.IntegerField(required=False)
    action = serializers.CharField(required=False, allow_blank=True)