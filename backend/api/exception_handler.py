from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework.exceptions import ErrorDetail


def _normalize_errors(data):
    if isinstance(data, list):
        return [
            str(item) if isinstance(item, ErrorDetail) else _normalize_errors(item)
            for item in data
        ]
    if isinstance(data, dict):
        return {
            key: _normalize_errors(value)
            for key, value in data.items()
        }
    if isinstance(data, ErrorDetail):
        return str(data)
    return data


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {"message": "Internal server error", "detail": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if response.status_code == status.HTTP_400_BAD_REQUEST:
        detail = response.data

        if isinstance(detail, dict) and "message" in detail and len(detail) == 1:
            return Response(
                {"message": detail["message"]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if isinstance(detail, dict) and "detail" in detail:
            return Response(
                {"message": str(detail["detail"])},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Validation error",
                "errors": _normalize_errors(detail),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail:
            return Response(
                {"message": str(detail["detail"])},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(
            {"message": "Unauthorized"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if response.status_code == status.HTTP_403_FORBIDDEN:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail:
            return Response(
                {"message": str(detail["detail"])},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {"message": "Forbidden"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if response.status_code == status.HTTP_404_NOT_FOUND:
        detail = response.data
        if isinstance(detail, dict) and "detail" in detail:
            return Response(
                {"message": str(detail["detail"])},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"message": "Resource not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if response.status_code == status.HTTP_409_CONFLICT:
        detail = _normalize_errors(response.data)
        if isinstance(detail, dict):
            return Response(detail, status=status.HTTP_409_CONFLICT)
        return Response(
            {"message": str(detail)},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(_normalize_errors(response.data), status=response.status_code)