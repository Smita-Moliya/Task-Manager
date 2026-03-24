import jwt
from django.conf import settings
from django.http import JsonResponse
from api.db import users_db


class JwtAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

        self.PUBLIC_PATHS = {
            "/api/auth/login/",
            "/api/auth/set-password/",
            "/api/auth/send-reset-link/",
            "/api/auth/google/",
            "/api/auth/refresh/",
        }

    def __call__(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)

        path = request.path
        if path in self.PUBLIC_PATHS:
            return self.get_response(request)

        if not request.path.startswith("/api/"):
            return self.get_response(request)

        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JsonResponse({"message": "Unauthorized"}, status=401)

        token = auth.split(" ", 1)[1].strip()
        if not token:
            return JsonResponse({"message": "Unauthorized"}, status=401)

        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
            user_id = payload.get("user_id")

            if not user_id:
                return JsonResponse({"message": "Unauthorized"}, status=401)

            user = users_db.get_user_by_id(user_id)
            if not user:
                return JsonResponse({"message": "User not found"}, status=401)

            request.user_id = user["id"]
            request.user = user
            request.role = user["role"]

        except jwt.ExpiredSignatureError:
            return JsonResponse({"message": "Token expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"message": "Invalid token"}, status=401)

        return self.get_response(request)