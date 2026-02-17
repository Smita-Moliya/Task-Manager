import json
import bcrypt
import jwt
import secrets
import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone as dt_timezone
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
from django.core.mail import send_mail,EmailMessage


# -----------------------------
# Helpers: token generation
# -----------------------------
def _create_invite_token_raw() -> str:
    # random token (safe to put in URL)
    return secrets.token_urlsafe(48)


def _hash_token(raw_token: str) -> str:
    # store only hash in DB (secure)
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _send_set_password_email(email: str, raw_token: str):
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend}/set-password?token={raw_token}"

    try:
        send_mail(
            subject="Set your password",
            message=(
                "Welcome!\n\n"
                "Click the link below to set your password:\n"
                f"{link}\n\n"
                "This link is one-time use and will expire.\n"
                "If you didn’t request this, ignore it."
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@taskapp.local"),
            recipient_list=[email],
            fail_silently=False,
        )
        return {"ok": True, "link": link}
    except Exception as e:
        # For dev: don’t break API, just return link
        print("EMAIL SEND FAILED:", str(e))
        print("PASSWORD SETUP LINK (DEV):", link)
        return {"ok": False, "link": link, "error": str(e)}


# -----------------------------
# AUTH: Login (JWT)
# -----------------------------
@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    email = (body.get("email") or "").strip().lower()
    password = (body.get("password") or "").strip()

    errors = {}
    if not email:
        errors["email"] = "Email is required"
    if not password:
        errors["password"] = "Password is required"
    if errors:
        return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

    with connection.cursor() as cur:
        cur.execute(
            "SELECT id, name, email, password_hash, role FROM users WHERE email=%s",
            [email],
        )
        row = cur.fetchone()

    if not row:
        return JsonResponse({"message": "Invalid email or password"}, status=401)

    user_id, name, email_db, pw_hash, role = row

    if not pw_hash:
        return JsonResponse(
            {
                "message": "Password not set yet. Please use the password setup link sent to your email."
            },
            status=403,
        )

    if not bcrypt.checkpw(password.encode("utf-8"), pw_hash.encode("utf-8")):
        return JsonResponse({"message": "Invalid email or password"}, status=401)

    exp = datetime.now(dt_timezone.utc) + timedelta(
        hours=getattr(settings, "JWT_EXP_HOURS", 6)
    )
    token = jwt.encode(
        {"user_id": user_id, "role": role, "exp": exp},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALG,
    )

    return JsonResponse(
        {"token": token, "user": {"id": user_id, "name": name, "email": email_db, "role": role}},
        status=200,
    )


# -----------------------------
# ADMIN: Create user WITHOUT password + send invite link
# -----------------------------
@csrf_exempt
def create_user(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can create users"}, status=403)

    print("CREATE_USER METHOD:", request.method)
    print("CREATE_USER HEADERS:", dict(request.headers))
    print("CREATE_USER BODY RAW:", request.body)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception as e:
        print("CREATE_USER JSON ERROR:", str(e))
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    print("CREATE_USER BODY JSON:", body)
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    role = (body.get("role") or "USER").strip().upper()

    errors = {}
    if not name:
        errors["name"] = "Name is required"
    if not email:
        errors["email"] = "Email is required"
    if role not in ("ADMIN", "USER"):
        errors["role"] = "Role must be ADMIN or USER"
    if errors:
        return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

    with connection.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email=%s", [email])
        existing = cur.fetchone()

    if existing:
        return JsonResponse(
            {"message": "User already exists. You can send reset link instead.", "email": email},
            status=409,
        )

    raw_token = _create_invite_token_raw()
    token_hash = _hash_token(raw_token)

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users(name,email,password_hash,role)
                VALUES(%s,%s,NULL,%s)
                RETURNING id
                """,
                [name, email, role],
            )
            user_id = cur.fetchone()[0]

            # store token_hash inside `token` column (your table has `token`, not `token_hash`)
            cur.execute(
                """
                INSERT INTO password_invites(user_id, token, created_at, is_used)
                VALUES(%s,%s,NOW(),FALSE)
                """,
                [user_id, token_hash],
            )
    except Exception as e:
        return JsonResponse({"message": "Failed to create user", "detail": str(e)}, status=400)

    _send_set_password_email(email, raw_token)
    return JsonResponse(
        {"message": "User created. Password setup link sent ✅", "user_id": user_id},
        status=201,
    )


# -----------------------------
# ADMIN: List users
# -----------------------------
def list_users(request):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can view users"}, status=403)

    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, email, role, created_at
            FROM users
            ORDER BY id ASC
            """
        )
        rows = cur.fetchall()

    users = [
        {"id": r[0], "name": r[1], "email": r[2], "role": r[3], "created_at": r[4]}
        for r in rows
    ]
    return JsonResponse({"users": users}, status=200)


# -----------------------------
# ADMIN: Resend password setup link
# -----------------------------
@csrf_exempt
def send_reset_link(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can send reset links"}, status=403)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    email = (body.get("email") or "").strip().lower()
    if not email:
        return JsonResponse(
            {"message": "Validation error", "errors": {"email": "Email is required"}},
            status=400,
        )

    with connection.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email=%s LIMIT 1", [email])
        row = cur.fetchone()
        if not row:
            return JsonResponse({"message": "User not found"}, status=404)

        user_id = row[0]

        # invalidate old unused tokens
        cur.execute(
            "UPDATE password_invites SET is_used=TRUE WHERE user_id=%s AND is_used=FALSE",
            [user_id],
        )

        raw_token = _create_invite_token_raw()
        token_hash = _hash_token(raw_token)

        # store hash inside existing `token` column
        cur.execute(
            """
            INSERT INTO password_invites(user_id, token, created_at, is_used)
            VALUES(%s,%s,NOW(),FALSE)
            """,
            [user_id, token_hash],
        )

    _send_set_password_email(email, raw_token)
    return JsonResponse({"message": "Password setup link sent ✅"}, status=200)


# -----------------------------
# PUBLIC: Set password using token
# -----------------------------
@csrf_exempt
def set_password_from_token(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    raw_token = (body.get("token") or "").strip()
    password = (body.get("password") or "").strip()
    confirm = (body.get("confirm_password") or "").strip()

    errors = {}
    if not raw_token:
        errors["token"] = "Token is required"
    if not password:
        errors["password"] = "Password is required"
    elif len(password) < 4:
        errors["password"] = "Password must be at least 4 characters"
    if password != confirm:
        errors["confirm_password"] = "Passwords do not match"

    if errors:
        return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

    token_hash = _hash_token(raw_token)

    exp_minutes = getattr(settings, "RESET_TOKEN_EXP_MINUTES", 60)

    with connection.cursor() as cur:
        # your table has: token, created_at, is_used (no token_hash, no expires_at)
        cur.execute(
            """
            SELECT pi.id, pi.user_id, pi.is_used, pi.created_at
            FROM password_invites pi
            WHERE pi.token=%s
            """,
            [token_hash],
        )
        row = cur.fetchone()

        if not row:
            return JsonResponse({"message": "Invalid or already used link"}, status=400)

        invite_id, user_id, is_used, created_at = row

        if is_used:
            return JsonResponse({"message": "Link already used. Please login."}, status=400)

        # created_at is naive timestamp; treat it as UTC for consistency
        created_at_utc = created_at.replace(tzinfo=dt_timezone.utc)
        expires_at = created_at_utc + timedelta(minutes=exp_minutes)

        if datetime.now(dt_timezone.utc) > expires_at:
            return JsonResponse({"message": "Link expired. Ask admin to resend link."}, status=400)

        pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", [pw_hash, user_id])
        cur.execute("UPDATE password_invites SET is_used=TRUE WHERE id=%s", [invite_id])

    return JsonResponse({"message": "Password set successfully ✅ Please login."}, status=200)


# -----------------------------
# Your existing tasks endpoints can remain as-is
# (No change needed for invite/password flow)
# -----------------------------
def _fetchall_dict(cur):
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

@csrf_exempt
def tasks(request):

    # =========================
    # ✅ GET TASKS
    # =========================
    if request.method == "GET":
        role = getattr(request, "role", None)
        user_id = getattr(request, "user_id", None)

        if not role or not user_id:
            return JsonResponse({"message": "Unauthorized"}, status=401)

        try:
            with connection.cursor() as cur:

                # ADMIN → see all tasks
                if role == "ADMIN":
                    cur.execute("""
                        SELECT id,title,description,status,
                               assigned_by,assigned_to,due_date,
                               created_at,updated_at
                        FROM tasks
                        ORDER BY id DESC
                    """)
                # USER → only their tasks
                else:
                    cur.execute("""
                        SELECT id,title,description,status,
                               assigned_by,assigned_to,due_date,
                               created_at,updated_at
                        FROM tasks
                        WHERE assigned_to=%s
                        ORDER BY id DESC
                    """, [user_id])

                rows = cur.fetchall()

            tasks_list = []
            for r in rows:
                tasks_list.append({
                    "id": r[0],
                    "title": r[1],
                    "description": r[2],
                    "status": r[3],
                    "assigned_by": r[4],
                    "assigned_to": r[5],
                    "due_date": str(r[6]) if r[6] else None,
                    "created_at": str(r[7]) if r[7] else None,
                    "updated_at": str(r[8]) if r[8] else None,
                })

            return JsonResponse({"tasks": tasks_list}, status=200)

        except Exception as e:
            print("TASK GET ERROR:", e)
            return JsonResponse({"message": "Failed to fetch tasks", "detail": str(e)}, status=500)

    # =========================
    # ✅ CREATE TASK (POST)
    # =========================
    if request.method == "POST":
        if getattr(request, "role", None) != "ADMIN":
            return JsonResponse({"message": "Only admin can create tasks"}, status=403)

        # ✅ detect multipart vs JSON
        is_multipart = request.content_type and request.content_type.startswith("multipart/form-data")

        if is_multipart:
            title = (request.POST.get("title") or "").strip()
            description = (request.POST.get("description") or "").strip()
            assigned_to = request.POST.get("assigned_to")
            due_date = request.POST.get("due_date") or None
            files = request.FILES.getlist("files")
        else:
            try:
                body = json.loads(request.body.decode("utf-8") or "{}")
            except:
                return JsonResponse({"message": "Invalid JSON"}, status=400)

            title = (body.get("title") or "").strip()
            description = (body.get("description") or "").strip()
            assigned_to = body.get("assigned_to")
            due_date = body.get("due_date") or None
            files = []

        errors = {}
        if not title:
            errors["title"] = "Title is required"
        if not assigned_to:
            errors["assigned_to"] = "Please select a user"
        if errors:
            return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

        assigned_by = getattr(request, "user_id", None)

        try:
            with connection.cursor() as cur:
                cur.execute("CALL sp_create_task(%s,%s,%s,%s,%s)", [
                    title,
                    description or None,
                    assigned_by,
                    int(assigned_to),
                    due_date or None
                ])

                # ✅ get task_id
                cur.execute("""
                    SELECT id FROM tasks
                    WHERE assigned_by=%s AND assigned_to=%s AND title=%s
                    ORDER BY id DESC
                    LIMIT 1
                """, [assigned_by, int(assigned_to), title])
                row = cur.fetchone()
                task_id = row[0] if row else None

                if not task_id:
                    return JsonResponse({"message": "Task created but task_id not found"}, status=500)

                # ✅ fetch assigned user's email
                cur.execute("SELECT email FROM users WHERE id=%s", [int(assigned_to)])
                urow = cur.fetchone()
                assigned_email = urow[0] if urow else None

                attachment_paths = []

                # ✅ store attachments
                for f in files:
                    folder = os.path.join(settings.MEDIA_ROOT, "task_attachments", str(task_id))
                    os.makedirs(folder, exist_ok=True)

                    stored_name = f"{uuid.uuid4().hex}_{f.name}"
                    full_path = os.path.join(folder, stored_name)

                    with open(full_path, "wb+") as dest:
                        for chunk in f.chunks():
                            dest.write(chunk)

                    cur.execute("""
                        INSERT INTO task_attachments(task_id, original_name, stored_name, file_path, mime_type)
                        VALUES(%s,%s,%s,%s,%s)
                    """, [task_id, f.name, stored_name, full_path, getattr(f, "content_type", None)])

                    attachment_paths.append(full_path)

            # ✅ send email
            if assigned_email:
                task_info = {
                    "id": task_id,
                    "title": title,
                    "description": description,
                    "due_date": due_date,
                    "status": "PENDING",
                }
                _send_task_assigned_email(assigned_email, task_info, attachment_paths)

            return JsonResponse(
                {"message": "Task created + email sent ✅", "task_id": task_id, "attachments": len(attachment_paths)},
                status=201,
            )

        except Exception as e:
            return JsonResponse({"message": "Failed to create task", "detail": str(e)}, status=400)

    return JsonResponse({"message": "Method not allowed"}, status=405)


@csrf_exempt
def task_by_id(request, task_id: int):

    role = getattr(request, "role", None)
    user_id = getattr(request, "user_id", None)

    if role is None or user_id is None:
        return JsonResponse({"message": "Unauthorized"}, status=401)

    # ================= GET ONE TASK =================
    if request.method == "GET":
        with connection.cursor() as cur:

            if role == "ADMIN":
                cur.execute("""
                    SELECT id,title,description,status,
                           assigned_by,assigned_to,due_date,
                           created_at,updated_at
                    FROM tasks WHERE id=%s
                """, [task_id])
            else:
                cur.execute("""
                    SELECT id,title,description,status,
                           assigned_by,assigned_to,due_date,
                           created_at,updated_at
                    FROM tasks
                    WHERE id=%s AND assigned_to=%s
                """, [task_id, user_id])

            row = cur.fetchone()

        if not row:
            return JsonResponse({"message": "Task not found"}, status=404)

        return JsonResponse({
            "task": {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "status": row[3],
                "assigned_by": row[4],
                "assigned_to": row[5],
                "due_date": str(row[6]) if row[6] else None,
                "created_at": str(row[7]) if row[7] else None,
                "updated_at": str(row[8]) if row[8] else None,
            }
        }, status=200)

    # ================= UPDATE TASK =================
    if request.method == "PATCH":

        if role != "ADMIN":
            return JsonResponse({"message": "Only admin can modify tasks"}, status=403)

        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except Exception:
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        title = (body.get("title") or "").strip()
        description = (body.get("description") or "").strip()
        status = (body.get("status") or "PENDING").strip().upper()
        assigned_to = body.get("assigned_to")
        due_date = body.get("due_date")

        errors = {}
        if not title:
            errors["title"] = "Title is required"
        if status not in ("PENDING", "IN_PROGRESS", "DONE"):
            errors["status"] = "Status must be PENDING / IN_PROGRESS / DONE"
        if not assigned_to:
            errors["assigned_to"] = "Assigned user required"
        if errors:
            return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

        with connection.cursor() as cur:
            cur.execute(
                "CALL sp_update_task(%s,%s,%s,%s,%s,%s)",
                [
                    task_id,
                    title,
                    description or None,
                    status,
                    int(assigned_to),
                    due_date or None,
                ],
            )

        return JsonResponse({"message": "Task updated"}, status=200)

    # ================= DELETE TASK =================
    if request.method == "DELETE":

        if role != "ADMIN":
            return JsonResponse({"message": "Only admin can delete tasks"}, status=403)

        with connection.cursor() as cur:
            cur.execute("CALL sp_delete_task(%s)", [task_id])

        return JsonResponse({"message": "Task deleted"}, status=200)

    return JsonResponse({"message": "Method not allowed"}, status=405)


@csrf_exempt
def update_my_task_status(request, task_id: int):
    if getattr(request, "role", None) != "USER":
        return JsonResponse({"message": "Only users can update task status here"}, status=403)

    if request.method != "PATCH":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    status = (body.get("status") or "").strip().upper()
    if status not in ("PENDING", "IN_PROGRESS", "DONE"):
        return JsonResponse({"message": "Invalid status"}, status=400)

    user_id = getattr(request, "user_id", None)

    try:
        with connection.cursor() as cur:
            cur.execute("CALL sp_user_update_task_status(%s,%s,%s)", [task_id, user_id, status])
        return JsonResponse({"message": "Status updated"}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=403)

@csrf_exempt
def delete_user(request, user_id: int):
    if request.method != "DELETE":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can delete users"}, status=403)

    # (Optional safety) prevent deleting self
    if getattr(request, "user_id", None) == user_id:
        return JsonResponse({"message": "Admin cannot delete self"}, status=400)

    try:
        with connection.cursor() as cur:
            # Ensure user exists
            cur.execute("SELECT id FROM users WHERE id=%s", [user_id])
            row = cur.fetchone()
            if not row:
                return JsonResponse({"message": "User not found"}, status=404)

            # IMPORTANT: if tasks table references assigned_to, you must handle it.
            # If you have tasks FK, either delete tasks or unassign them.
            # Example (unassign):
            # cur.execute("UPDATE tasks SET assigned_to=NULL WHERE assigned_to=%s", [user_id])

            cur.execute("DELETE FROM users WHERE id=%s", [user_id])

        return JsonResponse({"message": "User deleted ✅"}, status=200)

    except Exception as e:
        return JsonResponse({"message": "Failed to delete user", "detail": str(e)}, status=400)

def _send_task_assigned_email(to_email: str, task: dict, attachment_paths: list[str]):
    subject = f"Task Assigned: {task['title']}"
    body = (
        f"Hello,\n\n"
        f"A new task has been assigned to you.\n\n"
        f"Task ID: {task['id']}\n"
        f"Title: {task['title']}\n"
        f"Description: {task.get('description') or '-'}\n"
        f"Due Date: {task.get('due_date') or '-'}\n"
        f"Status: {task.get('status') or 'PENDING'}\n\n"
        f"Regards,\nTask Manager"
    )

    msg = EmailMessage(
        subject=subject,
        body=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@taskapp.local"),
        to=[to_email],
    )

    for p in attachment_paths:
        if os.path.exists(p):
            msg.attach_file(p)

    msg.send(fail_silently=False)