from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.utils.decorators import require_methods, require_auth
from api.serializers.task_activity_serializer import TaskActivityQuerySerializer
from api.services.task_activity_service import get_task_activity_payload, get_my_activity_payload


@csrf_exempt
@require_methods(["GET"])
@require_auth
def task_activity(request, task_id: int):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Forbidden"}, status=403)

    serializer = TaskActivityQuerySerializer(data=request.GET)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    payload = get_task_activity_payload(task_id, serializer.validated_data)

    if "__error__" in payload:
        err = payload["__error__"]
        return JsonResponse(err["body"], status=err["status"])

    return JsonResponse(payload, status=200)


@csrf_exempt
@require_methods(["GET"])
@require_auth
def my_activity(request):
    user_id = request.user_id

    try:
        payload = get_my_activity_payload(user_id)
        return JsonResponse(payload, status=200)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {"message": "Failed to fetch activity", "detail": str(e)},
            status=500,
        )