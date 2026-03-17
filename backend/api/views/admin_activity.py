from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.utils.decorators import require_methods, require_auth
from api.services.activity_service import get_admin_activity_payload
from api.serializers.activity_serializer import AdminActivityQuerySerializer


@csrf_exempt
@require_methods(["GET"])
@require_auth
def admin_activity(request):
    if request.role != "ADMIN":
        return JsonResponse({"message": "Forbidden"}, status=403)

    serializer = AdminActivityQuerySerializer(data=request.GET)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    return JsonResponse(get_admin_activity_payload(serializer.validated_data), status=200)