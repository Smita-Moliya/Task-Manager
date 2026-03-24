from rest_framework import serializers


class ProjectCreateUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, trim_whitespace=True)
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    status = serializers.ChoiceField(
        choices=["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"],
        required=False,
        default="ACTIVE"
    )
    priority = serializers.ChoiceField(
        choices=["LOW", "MEDIUM", "HIGH"],
        required=False,
        default="MEDIUM"
    )
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project name is required.")
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": ["End date cannot be before start date."]
            })

        return attrs


class ProjectListQuerySerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"],
        required=False,
        allow_null=True
    )