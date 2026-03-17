from rest_framework import serializers


class CreateUserSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, allow_blank=False, max_length=255)
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=["ADMIN", "USER"], required=False, default="USER")

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name is required")
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_role(self, value):
        return value.strip().upper()


class SendResetLinkSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required")
        return value


class SetPasswordFromTokenSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(required=True, allow_blank=False, min_length=8)
    confirm_password = serializers.CharField(required=True, allow_blank=False)

    def validate_token(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Token is required")
        return value

    def validate_password(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Password is required")
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        return attrs

class UserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=["ADMIN", "USER"], required=True)
    
    
