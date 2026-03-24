import jwt

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from api.db import users_db

class AuthenticatedUser(dict):
    @property
    def is_authenticated(self):
        return True


class CustomJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed("Invalid authorization header")

        token = parts[1]

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALG],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Access token expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid access token")

        if payload.get("type") != "access":
            raise AuthenticationFailed("Invalid token type")

        user_id = payload.get("user_id")
        if not user_id:
            raise AuthenticationFailed("Invalid token payload")

        user = users_db.get_user_by_id(user_id)
        if not user:
            raise AuthenticationFailed("User not found")

        auth_user = AuthenticatedUser(
            {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            }
        )

        request.user = auth_user
        request.user_id = auth_user["id"]
        request.role = auth_user["role"]

        return (auth_user, token)