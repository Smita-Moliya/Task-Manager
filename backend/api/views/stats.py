from django.http import JsonResponse
from api.utils.decorators import require_auth, require_admin
from api.services.stats_service import get_admin_stats


@require_auth
@require_admin
def admin_stats(request):
    payload = get_admin_stats()
    return JsonResponse(payload, status=200)