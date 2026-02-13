import json
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    email = (body.get("email") or "").strip()
    password = (body.get("password") or "").strip()

    errors = {}
    if not email:
        errors["email"] = "Email is required"
    if not password:
        errors["password"] = "Password is required"
    if errors:
        return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

    # fetch user from PostgreSQL
    with connection.cursor() as cur:
        cur.execute("SELECT id, name, email, password_hash, role FROM users WHERE email=%s", [email])
        row = cur.fetchone()

    if not row:
        return JsonResponse({"message": "Invalid email or password"}, status=401)

    user_id, name, email_db, pw_hash, role = row

    if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
        return JsonResponse({"message": "Invalid email or password"}, status=401)

    exp = datetime.now(timezone.utc) + timedelta(hours=getattr(settings, "JWT_EXP_HOURS", 6))
    token = jwt.encode(
        {"user_id": user_id, "role": role, "exp": exp},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALG,
    )

    return JsonResponse(
        {
            "token": token,
            "user": {"id": user_id, "name": name, "email": email_db, "role": role},
        },
        status=200,
    )


@csrf_exempt
def create_user(request):
    # JWT middleware already ran for this endpoint
    if request.method != "POST":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    if getattr(request, "role", None) != "ADMIN":
        print("ROLE RECEIVED:", getattr(request, "role", None))
        return JsonResponse({"message": "Only admin can create users"}, status=403)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    password = (body.get("password") or "").strip()
    role = (body.get("role") or "USER").strip()

    errors = {}
    if not name:
        errors["name"] = "Name is required"
    if not email:
        errors["email"] = "Email is required"
    if not password:
        errors["password"] = "Password is required"
    elif len(password) < 4:
        errors["password"] = "Password must be at least 4 characters"
    if role not in ("ADMIN", "USER"):
        errors["role"] = "Role must be ADMIN or USER"

    if errors:
        return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO users(name,email,password_hash,role) VALUES(%s,%s,%s,%s) RETURNING id",
                [name, email, pw_hash, role],
            )
            new_id = cur.fetchone()[0]
    except Exception as e:
        if "unique" in str(e).lower():
            return JsonResponse(
                {"message": "Validation error", "errors": {"email": "Email already exists"}},
                status=400,
            )
        return JsonResponse({"message": "Failed to create user", "detail": str(e)}, status=400)

    return JsonResponse({"message": "User created", "user_id": new_id}, status=201)

def list_users(request):
    # JWT middleware already ran

    #  Only ADMIN allowed
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse(
            {"message": "Only admin can view users"},
            status=403
        )

    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, name, email, role, created_at
            FROM users
            ORDER BY id ASC
        """)
        rows = cur.fetchall()

    users = []
    for row in rows:
        users.append({
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "created_at": row[4],
        })

    return JsonResponse({"users": users}, status=200)


def _fetchall_dict(cur):
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


@csrf_exempt
def tasks(request):
    # JWT middleware already ran → request.user_id, request.role available

    #  GET: admin sees all, user sees own
    if request.method == "GET":
        user_id = getattr(request, "user_id", None)
        role = getattr(request, "role", None)

        with connection.cursor() as cur:
            cur.execute("SELECT * FROM fn_get_tasks(%s, %s)", [user_id, role])
            data = _fetchall_dict(cur)

        return JsonResponse({"tasks": data}, status=200)

    #  POST: admin creates task
    if request.method == "POST":
        if getattr(request, "role", None) != "ADMIN":
            return JsonResponse({"message": "Only admin can create tasks"}, status=403)

        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except:
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        title = (body.get("title") or "").strip()
        description = (body.get("description") or "").strip()
        assigned_to = body.get("assigned_to")
        due_date = body.get("due_date")  # "YYYY-MM-DD" or null

        errors = {}
        if not title:
            errors["title"] = "Title is required"
        if not assigned_to:
            errors["assigned_to"] = "Please select a user"
        if errors:
            return JsonResponse({"message": "Validation error", "errors": errors}, status=400)

        assigned_by = getattr(request, "user_id")

        with connection.cursor() as cur:
            cur.execute("CALL sp_create_task(%s,%s,%s,%s,%s)", [
                title, description or None, assigned_by, int(assigned_to), due_date or None
            ])

        return JsonResponse({"message": "Task created"}, status=201)

    return JsonResponse({"message": "Method not allowed"}, status=405)


@csrf_exempt
def task_by_id(request, task_id: int):
    # PATCH/DELETE admin only
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can modify tasks"}, status=403)

    if request.method == "PATCH":
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except:
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
            cur.execute("CALL sp_update_task(%s,%s,%s,%s,%s,%s)", [
                task_id, title, description or None, status, int(assigned_to), due_date or None
            ])

        return JsonResponse({"message": "Task updated"}, status=200)

    if request.method == "DELETE":
        with connection.cursor() as cur:
            cur.execute("CALL sp_delete_task(%s)", [task_id])
        return JsonResponse({"message": "Task deleted"}, status=200)

    return JsonResponse({"message": "Method not allowed"}, status=405)


@csrf_exempt
def update_my_task_status(request, task_id: int):
    # Only USER can use this endpoint
    if getattr(request, "role", None) != "USER":
        return JsonResponse({"message": "Only users can update task status here"}, status=403)

    if request.method != "PATCH":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except:
        return JsonResponse({"message": "Invalid JSON"}, status=400)

    status = (body.get("status") or "").strip().upper()
    if status not in ("PENDING", "IN_PROGRESS", "DONE"):
        return JsonResponse({"message": "Invalid status"}, status=400)

    user_id = getattr(request, "user_id", None)

    try:
        with connection.cursor() as cur:
            cur.execute("CALL sp_user_update_task_status(%s,%s,%s)", [task_id, user_id, status])
        return JsonResponse({"message": "Status updated "}, status=200)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=403)
    

def _fetchone_dict(cur):
    cols = [c[0] for c in cur.description]
    row = cur.fetchone()
    if not row:
        return None
    return dict(zip(cols, row))


@csrf_exempt
def get_task(request, task_id: int):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can view task"}, status=403)

    if request.method != "GET":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, title, description, status, assigned_to, due_date
            FROM tasks
            WHERE id = %s
        """, [task_id])
        task = _fetchone_dict(cur)

    if not task:
        return JsonResponse({"message": "Task not found"}, status=404)

    return JsonResponse({"task": task}, status=200)


@csrf_exempt
def admin_update_task(request, task_id: int):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can update tasks"}, status=403)

    if request.method != "PATCH":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except:
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
        cur.execute("CALL sp_update_task(%s,%s,%s,%s,%s,%s)", [
            task_id,
            title,
            description or None,
            status,
            int(assigned_to),
            due_date or None
        ])

    return JsonResponse({"message": "Task updated "}, status=200)


@csrf_exempt
def admin_delete_task(request, task_id: int):
    if getattr(request, "role", None) != "ADMIN":
        return JsonResponse({"message": "Only admin can delete tasks"}, status=403)

    if request.method != "DELETE":
        return JsonResponse({"message": "Method not allowed"}, status=405)

    with connection.cursor() as cur:
        cur.execute("CALL sp_delete_task(%s)", [task_id])

    return JsonResponse({"message": "Task deleted "}, status=200)
