import bcrypt
import traceback
from datetime import datetime, timedelta, timezone as dt_timezone
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.utils.decorators import require_methods, require_auth, require_admin, json_required
from api.utils.token_utils import create_invite_token_raw, hash_token
from api.utils.mailer import send_set_password_email
from api.services import user_service as us
from api.serializers.user_serializer import (
    CreateUserSerializer,
    SendResetLinkSerializer,
    SetPasswordFromTokenSerializer,
    UserUpdateSerializer,
)
@csrf_exempt
@require_methods(["POST"])
@require_auth
@require_admin
@json_required
def create_user(request, body):
    serializer = CreateUserSerializer(data=body)

    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    data = serializer.validated_data
    name = data["name"]
    email = data["email"]
    role = data["role"]

    if us.user_exists_by_email(email):
        return JsonResponse(
            {"message": "User already exists.", "email": email},
            status=409,
        )

    raw_token = create_invite_token_raw()
    token_hash = hash_token(raw_token)

    try:
        user_id = us.create_user_returning_id(name, email, role)
        us.insert_password_invite(user_id, token_hash)
    except Exception as e:
        return JsonResponse(
            {"message": "Failed to create user", "detail": str(e)},
            status=400
        )

    send_set_password_email(email, raw_token)
    return JsonResponse(
        {"message": "User created. Password setup link sent !", "user_id": user_id},
        status=201
    )


def list_users(request):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can view users"}, status=403)

    # pagination params
    try:
        page = int(request.GET.get("page", "1"))
    except:
        page = 1

    try:
        page_size = int(request.GET.get("page_size", "10"))
    except:
        page_size = 10

    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100

    offset = (page - 1) * page_size

    total = us.users_count()
    rows = us.list_users_page(page_size, offset)

    users = [{"id": r[0], "name": r[1], "email": r[2], "role": r[3], "created_at": r[4]} for r in rows]
    total_pages = (total + page_size - 1) // page_size

    return JsonResponse({
        "items": users,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }, status=200)

@csrf_exempt
@require_methods(["POST"])
@json_required
def send_reset_link(request, body):
    serializer = SendResetLinkSerializer(data=body)

    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    data = serializer.validated_data
    email = data["email"]

    user_id = us.get_user_id_by_email(email)
    if not user_id:
        return JsonResponse({"message": "User not found"}, status=404)

    us.mark_active_invites_used(user_id)

    raw_token = create_invite_token_raw()
    token_hash = hash_token(raw_token)

    us.insert_password_invite(user_id, token_hash)

    send_set_password_email(email, raw_token)
    return JsonResponse({"message": "Password setup link sent !"}, status=200)

@csrf_exempt
@require_methods(["POST"])
@json_required
def set_password_from_token(request, body):
    serializer = SetPasswordFromTokenSerializer(data=body)

    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400
        )

    data = serializer.validated_data
    raw_token = data["token"]
    password = data["password"]

    token_hash = hash_token(raw_token)
    exp_minutes = getattr(settings, "RESET_TOKEN_EXP_MINUTES", 60)

    row = us.get_invite_by_token(token_hash)

    if not row:
        return JsonResponse({"message": "Invalid or already used link"}, status=400)

    invite_id, user_id, is_used, created_at = row

    if is_used:
        return JsonResponse({"message": "Link already used. Please login."}, status=400)

    created_at_utc = created_at.replace(tzinfo=dt_timezone.utc)
    expires_at = created_at_utc + timedelta(minutes=exp_minutes)

    if datetime.now(dt_timezone.utc) > expires_at:
        return JsonResponse({"message": "Link expired. Ask admin to resend link."}, status=400)

    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    us.update_user_password_hash(user_id, pw_hash)
    us.mark_invite_used(invite_id)

    return JsonResponse({"message": "Password set successfully! Please login."}, status=200)

@csrf_exempt
@require_methods(["DELETE"])
@require_auth
@require_admin
def delete_user(request, user_id: int):
    if getattr(request, "user_id", None) == user_id:
        return JsonResponse({"message": "Admin cannot delete self"}, status=400)

    try:
        if not us.user_exists_by_id(user_id):
            return JsonResponse({"message": "User not found"}, status=404)

        if us.user_has_assigned_tasks(user_id):
            return JsonResponse(
                {
                    "message": "Cannot delete user because tasks are assigned to this user. Please delete the tasks first."
                },
                status=400
            )

        us.delete_user_by_id(user_id)
        return JsonResponse({"message": "User deleted successfully"}, status=200)

    except Exception as e:
        print("DELETE USER ERROR:", repr(e))
        return JsonResponse({"message": "Failed to delete user"}, status=400)
    

@csrf_exempt
@require_methods(["PUT"])
@require_auth
@require_admin
@json_required
def update_user(request, body, user_id: int):
    serializer = UserUpdateSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400,
        )

    data = serializer.validated_data
    name = data["name"].strip()
    email = data["email"].strip().lower()
    role = data["role"].strip().upper()

    try:
        existing = us.get_user_by_id(user_id)
        if not existing:
            return JsonResponse({"message": "User not found"}, status=404)

        email_owner = us.get_user_by_email(email)
        if email_owner and int(email_owner["id"]) != int(user_id):
            return JsonResponse({"message": "Email already exists."}, status=400)

        # self edit -> allow name/email but lock role
        if request.user_id == user_id:
            safe_role = existing["role"]

        # editing another admin -> allow name/email but lock role
        elif existing["role"] == "ADMIN":
            safe_role = existing["role"]

        # editing normal user -> allow role change
        else:
            safe_role = role

        updated = us.update_user(
            user_id=user_id,
            name=name,
            email=email,
            role=safe_role,
        )

        if not updated:
            return JsonResponse({"message": "Failed to update user"}, status=500)

        return JsonResponse(
            {
                "message": "User updated ✅",
                "user": updated,
            },
            status=200,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {"message": "User update failed", "detail": str(e)},
            status=500,
        )