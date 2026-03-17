from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, allow_blank=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required")
        return value

    def validate_password(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Password is required")
        return value


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True, allow_blank=False)

    def validate_refresh(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Refresh token required")
        return value