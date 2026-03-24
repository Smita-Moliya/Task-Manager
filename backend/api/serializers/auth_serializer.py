from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        write_only=True,
    )

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required")
        return value


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        write_only=True,
    )

    def validate_refresh(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Refresh token required")
        return value