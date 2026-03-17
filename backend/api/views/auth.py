from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.utils.decorators import require_methods, json_required
from api.services.auth_service import (
    login_service,
    refresh_access_service,
    logout_service,
)
from api.serializers.auth_serializer import LoginSerializer, RefreshTokenSerializer


@csrf_exempt
@require_methods(["POST"])
@json_required
def login(request, body):
    serializer = LoginSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    data = serializer.validated_data
    email = data["email"]
    password = data["password"]

    status, payload = login_service(email, password)
    return JsonResponse(payload, status=status)


@csrf_exempt
@require_methods(["POST"])
@json_required
def refresh_access_token(request, body):
    serializer = RefreshTokenSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    refresh = serializer.validated_data["refresh"]

    status, payload = refresh_access_service(refresh)
    return JsonResponse(payload, status=status)


@csrf_exempt
@require_methods(["POST"])
@json_required
def logout(request, body):
    serializer = RefreshTokenSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    refresh_raw = serializer.validated_data["refresh"]

    status, payload = logout_service(refresh_raw)
    return JsonResponse(payload, status=status)