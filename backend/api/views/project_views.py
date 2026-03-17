from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.utils.decorators import require_methods, require_auth, require_admin, json_required
from api.services import project_service as ps

@json_required
@csrf_exempt
@require_methods(["POST"])
@require_auth
@require_admin
def create_project(request, body):
    actor_id = request.user_id

    result = ps.create_project_service(body, actor_id)
    if not result["ok"]:
        if "errors" in result:
            return JsonResponse({"errors": result["errors"]}, status=400)
        return JsonResponse({"message": result["message"]}, status=400)

    return JsonResponse({
        "message": "Project created successfully",
        "project": result["project"]
    }, status=201)


@require_methods(["GET"])
@require_auth
def list_projects(request):
    q = (request.GET.get("q") or "").strip()
    status = (request.GET.get("status") or "").strip() or None

    result = ps.list_projects_service(q=q, status=status)
    return JsonResponse({"projects": result["projects"]}, status=200)


@require_methods(["GET"])
@require_auth
def get_project(request, project_id):
    result = ps.get_project_detail_service(project_id)
    if not result["ok"]:
        return JsonResponse({"message": result["message"]}, status=404)

    return JsonResponse({
        "project": result["project"],
        "summary": result["summary"]
    }, status=200)


@json_required
@csrf_exempt
@require_methods(["PUT"])
@require_auth
@require_admin
def update_project(request, project_id, body):
    actor_id = request.user_id

    result = ps.update_project_service(project_id, body, actor_id)
    if not result["ok"]:
        if "errors" in result:
            return JsonResponse({"errors": result["errors"]}, status=400)
        return JsonResponse({"message": result["message"]}, status=404)

    return JsonResponse({
        "message": "Project updated successfully",
        "project": result["project"]
    }, status=200)


@csrf_exempt
@require_methods(["DELETE"])
@require_auth
@require_admin
def delete_project(request, project_id):
    actor_id = request.user_id

    result = ps.delete_project_service(project_id, actor_id)
    if not result["ok"]:
        code = 404 if result["message"] == "Project not found" else 400
        return JsonResponse({"message": result["message"]}, status=code)

    return JsonResponse({"message": "Project deleted successfully"}, status=200)