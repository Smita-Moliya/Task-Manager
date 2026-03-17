from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.utils.decorators import require_methods, require_auth, json_required
from api.utils.permissions import ensure_task_access
from api.utils.activity import log_activity, COMMENT_ADDED

from api.services import comments_service as cs
from api.services import me_service as ms
from api.serializers.comment_serializer import TaskCommentCreateSerializer


@csrf_exempt
@require_methods(["GET", "POST"])
@require_auth
def task_comments(request, task_id: int):
    err = ensure_task_access(request, task_id)
    if err:
        return err

    if request.method == "GET":
        comments = cs.get_task_comments(task_id)
        return JsonResponse({"comments": comments}, status=200)

    return _task_comments_create(request, task_id)


@csrf_exempt
@require_methods(["POST"])
@require_auth
@json_required
def _task_comments_create(request, body, task_id: int):
    err = ensure_task_access(request, task_id)
    if err:
        return err

    serializer = TaskCommentCreateSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    user_id = request.user_id
    comment = serializer.validated_data["comment"]

    created = cs.add_task_comment(task_id, user_id, comment)

    log_activity(
        task_id=task_id,
        actor_id=user_id,
        action=COMMENT_ADDED,
        message="Comment added",
        meta={"comment_id": created["id"], "comment": comment[:200]}
    )

    return JsonResponse({"message": "Comment added ✅", "comment": created}, status=201)


@csrf_exempt
@require_methods(["GET"])
@require_auth
def me_attachments(request):
    role = getattr(request, "role", None)
    user_id = getattr(request, "user_id", None)

    if not role or not user_id:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    attachments = ms.get_me_attachments(role, user_id)
    return JsonResponse({"attachments": attachments}, status=200)


@csrf_exempt
@require_methods(["GET"])
@require_auth
def me_comments(request):
    role = getattr(request, "role", None)
    user_id = getattr(request, "user_id", None)

    if not role or not user_id:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    comments = ms.get_me_comments(role, user_id)
    return JsonResponse({"comments": comments}, status=200)