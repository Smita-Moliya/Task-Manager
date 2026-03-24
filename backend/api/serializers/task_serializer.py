import datetime
from rest_framework import serializers


class FlexibleDateField(serializers.Field):
    def to_internal_value(self, value):
        if value is None:
            return None

        if isinstance(value, datetime.date):
            return value

        if not isinstance(value, str):
            raise serializers.ValidationError("Invalid due_date")

        s = value.strip()
        if s == "" or s.lower() == "null":
            return None

        s = s.replace(" ", "")

        if len(s) >= 10 and s[4:5] == "-" and s[7:8] == "-":
            try:
                return datetime.date.fromisoformat(s[:10])
            except Exception:
                raise serializers.ValidationError("Invalid due_date")

        for fmt in ("%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.datetime.strptime(s, fmt).date()
            except Exception:
                pass

        raise serializers.ValidationError("Invalid due_date")

    def to_representation(self, value):
        return str(value) if value else None


class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(required=True, allow_blank=False, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    assigned_to = serializers.IntegerField(required=True)
    project_id = serializers.IntegerField(required=True)
    status = serializers.ChoiceField(
        choices=["PENDING", "IN_PROGRESS", "DONE"],
        required=False,
        default="PENDING",
    )
    due_date = FlexibleDateField(required=False, allow_null=True)

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required")
        return value

    def validate_description(self, value):
        if value is None:
            return None
        return value.strip()

    def validate_assigned_to(self, value):
        if not value:
            raise serializers.ValidationError("Please select a user")
        return value

    def validate_project_id(self, value):
        if not value:
            raise serializers.ValidationError("Please select a project")
        return value


class TaskUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(required=True, allow_blank=False, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    status = serializers.ChoiceField(
        choices=["PENDING", "IN_PROGRESS", "DONE"],
        required=True,
    )
    assigned_to = serializers.IntegerField(required=True)
    due_date = FlexibleDateField(required=False, allow_null=True)

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required")
        return value

    def validate_description(self, value):
        if value is None:
            return None
        return value.strip()


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["PENDING", "IN_PROGRESS", "DONE"],
        required=True,
    )

    def validate_status(self, value):
        return value.strip().upper()


class TaskListQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=10, min_value=1)
    q = serializers.CharField(required=False, allow_blank=True, default="")
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    project_id = serializers.IntegerField(required=False, allow_null=True)