from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.utils.decorators import require_methods, require_auth, require_admin, json_required
from api.services import project_member_service as pms


@require_methods(["GET"])
@require_auth
def list_project_members(request, project_id):
    try:
        print("=== LIST PROJECT MEMBERS VIEW HIT ===", project_id)
        result = pms.list_project_members_service(project_id)
        if not result["ok"]:
            return JsonResponse({"message": result["message"]}, status=404)

        return JsonResponse({"members": result["members"]}, status=200)
    except Exception as e:
        print("LIST PROJECT MEMBERS VIEW ERROR:", repr(e))
        return JsonResponse({"message": str(e)}, status=500)


@json_required
@csrf_exempt
@require_methods(["POST"])
@require_auth
@require_admin
def add_project_members(request, project_id, body):
    print("=== ADD PROJECT MEMBERS VIEW HIT ===")
    print("PROJECT ID:", project_id)
    print("BODY:", body)
    print("ACTOR ID:", getattr(request, "user_id", None))
    try:
        actor_id = request.user_id
        result = pms.add_project_members_service(project_id, body, actor_id)

        print("ADD MEMBER RESULT:", result)

        if not result["ok"]:
            return JsonResponse({"message": result["message"]}, status=400)

        return JsonResponse({
            "message": "Members processed successfully",
            "added": result["added"],
            "errors": result["errors"]
        }, status=200)
    except Exception as e:
        print("ADD PROJECT MEMBER VIEW ERROR:", repr(e))
        return JsonResponse({"message": str(e)}, status=500)

@csrf_exempt
@require_methods(["DELETE"])
@require_auth
@require_admin
def remove_project_member(request, project_id, user_id):
    try:
        print("=== REMOVE PROJECT MEMBER VIEW HIT ===")
        print("PROJECT ID:", project_id)
        print("USER ID:", user_id)
        print("ACTOR ID:", getattr(request, "user_id", None))

        actor_id = request.user_id
        result = pms.remove_project_member_service(project_id, user_id, actor_id)

        print("REMOVE MEMBER RESULT:", result)

        if not result["ok"]:
            code = 404 if result["message"] == "Project not found" else 400
            return JsonResponse({"message": result["message"]}, status=code)

        return JsonResponse({"message": "Member removed successfully"}, status=200)

    except Exception as e:
        print("REMOVE PROJECT MEMBER VIEW ERROR:", repr(e))
        return JsonResponse({"message": str(e)}, status=500)