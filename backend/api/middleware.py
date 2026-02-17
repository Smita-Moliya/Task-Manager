import jwt
from django.conf import settings
from django.http import JsonResponse

class JwtAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

        # ✅ public endpoints (no token required)
        self.PUBLIC_PATHS = {
            "/api/auth/login/",
            "/api/auth/set-password/",
        }

    def __call__(self, request):
        # ✅ allow preflight CORS always
        if request.method == "OPTIONS":
            return self.get_response(request)

        # ✅ allow public paths without JWT
        if request.path in self.PUBLIC_PATHS:
            return self.get_response(request)

        # ---- JWT check for all other /api routes ----
        # If you want to protect only /api/* routes, uncomment:
        # if not request.path.startswith("/api/"):
        #     return self.get_response(request)

        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JsonResponse({"message": "Unauthorized"}, status=401)

        token = auth.split(" ", 1)[1].strip()
        if not token:
            return JsonResponse({"message": "Unauthorized"}, status=401)

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALG],
            )
            request.user_id = payload.get("user_id")
            request.role = payload.get("role")
        except jwt.ExpiredSignatureError:
            return JsonResponse({"message": "Token expired"}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({"message": "Invalid token"}, status=401)

        return self.get_response(request)
