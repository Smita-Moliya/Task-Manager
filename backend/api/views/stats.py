from django.http import JsonResponse
from api.utils.decorators import require_auth, require_permission
from api.services.stats_service import get_admin_stats


@require_auth
@require_permission("view_admin_stats")
def admin_stats(request):
    payload = get_admin_stats()
    return JsonResponse(payload, status=200)