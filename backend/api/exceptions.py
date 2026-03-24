from rest_framework.exceptions import APIException


class ConflictError(APIException):
    status_code = 409
    default_detail = "Conflict."


class BadRequestError(APIException):
    status_code = 400
    default_detail = "Bad request."