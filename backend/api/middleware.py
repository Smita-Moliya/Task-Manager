import jwt
from django.conf import settings
from django.http import JsonResponse

PUBLIC_PATHS = {
    "/api/hello/",
    "/api/auth/login/",
}

class JwtAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        if request.method == "OPTIONS":
            return self.get_response(request)

        if request.path in PUBLIC_PATHS:
            return self.get_response(request)

        auth = request.headers.get("Authorization", "")

        if not auth.startswith("Bearer "):
            return JsonResponse({"message": "Token missing"}, status=401)

        token = auth.split(" ")[1]

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALG]
            )

            # 🔥 VERY IMPORTANT
            request.user_id = payload["user_id"]
            request.role = payload["role"].strip().upper()

        except Exception as e:
            return JsonResponse({"message": "Invalid token"}, status=401)

        return self.get_response(request)
