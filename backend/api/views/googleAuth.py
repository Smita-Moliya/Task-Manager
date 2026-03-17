# api/views/googleAuth.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from api.services.google_auth_service import google_auth_service


@csrf_exempt
def google_auth(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    status, payload = google_auth_service(request.body)
    return JsonResponse(payload, status=status)