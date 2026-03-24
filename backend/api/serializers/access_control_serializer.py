from rest_framework import serializers


class PageAccessItemSerializer(serializers.Serializer):
    page_key = serializers.CharField(max_length=100)
    allowed = serializers.BooleanField()


class UpdateRolePageAccessSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["ADMIN", "USER"])
    pages = PageAccessItemSerializer(many=True)