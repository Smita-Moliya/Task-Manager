from django.http import JsonResponse
from api.utils.decorators import require_methods, require_auth, require_admin
from api.services.analytics_service import project_analytics_service


@require_methods(["GET"])
@require_auth
@require_admin
def project_analytics(request):
    result = project_analytics_service()
    return JsonResponse(result["data"], status=200)