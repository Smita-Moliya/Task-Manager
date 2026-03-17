import os
import uuid
import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from api.db.users_db import get_user_email_name
from api.utils.mailer import send_task_assigned_email
from api.utils.decorators import require_methods, require_auth, json_required
from api.utils.activity import (
    log_activity,
    TASK_CREATED,
    TASK_UPDATED,
    STATUS_CHANGED,
    TASK_DELETED,
    ATTACHMENT_UPLOADED,
)
from api.services import tasks_service as ts
from api.db import tasks_db
from api.serializers.task_serializer import (
    TaskListQuerySerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusUpdateSerializer,
)


# =========================
# TASKS (LIST + CREATE)
# =========================
@csrf_exempt
@require_methods(["GET", "POST"])
@require_auth
def tasks(request):
    role = request.role
    user_id = request.user_id

    # ---------- GET: list tasks (pagination) ----------
    if request.method == "GET":
        try:
            query_serializer = TaskListQuerySerializer(data=request.GET)
            if not query_serializer.is_valid():
                return JsonResponse(
                    {"message": "Validation error", "errors": query_serializer.errors},
                    status=400
                )

            data = query_serializer.validated_data
            page = data["page"]
            page_size = data["page_size"]
            q = data.get("q", "")
            assigned_to = data.get("assigned_to")
            project_id = data.get("project_id")

            payload = ts.list_tasks(
                role=role,
                user_id=user_id,
                page=page,
                page_size=page_size,
                q=q,
                assigned_to=assigned_to,
                project_id=project_id,
            )
            return JsonResponse(payload, status=200)

        except Exception as e:
            print("TASK GET ERROR:", e)
            return JsonResponse(
                {"message": "Failed to fetch tasks", "detail": str(e)},
                status=500
            )

    # ---------- POST: create task (ADMIN only) ----------
    if role != "ADMIN":
        return JsonResponse({"message": "Only admin can create tasks"}, status=403)

    is_multipart = (
        request.content_type
        and request.content_type.startswith("multipart/form-data")
    )
    if is_multipart:
        return _tasks_create_multipart(request)

    return _tasks_create_json(request)


@csrf_exempt
@require_methods(["POST"])
@require_auth
def _tasks_create_multipart(request):
    user_id = request.user_id
    files = request.FILES.getlist("files")

    serializer = TaskCreateSerializer(data=request.POST)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400,
        )

    data = serializer.validated_data
    title = data["title"]
    description = data.get("description")
    assigned_to = data["assigned_to"]
    project_id = data["project_id"]
    status = data.get("status", "PENDING")
    due_date = data.get("due_date")

    assigned_by = user_id

    try:
        task = tasks_db.create_task_with_project(
            title=title,
            description=description or None,
            status=status,
            assigned_by=assigned_by,
            assigned_to=assigned_to,
            due_date=due_date,
            project_id=project_id,
        )

        task_id = task["id"]

        saved_names = []
        saved_paths = []

        for f in files:
            folder = os.path.join(settings.MEDIA_ROOT, "task_attachments", str(task_id))
            os.makedirs(folder, exist_ok=True)

            stored_name = f"{uuid.uuid4().hex}_{f.name}"
            full_path = os.path.join(folder, stored_name)

            with open(full_path, "wb+") as dest:
                for chunk in f.chunks():
                    dest.write(chunk)

            tasks_db.insert_task_attachment(
                task_id,
                f.name,
                stored_name,
                full_path,
                getattr(f, "content_type", None),
            )

            saved_names.append(f.name)
            saved_paths.append(full_path)

        log_activity(
            task_id=task_id,
            actor_id=user_id,
            action=TASK_CREATED,
            message=f"Task created: {title}",
            meta={
                "title": title,
                "assigned_to": assigned_to,
                "project_id": project_id,
                "status": status,
                "due_date": str(due_date) if due_date else None,
            },
        )

        if saved_names:
            log_activity(
                task_id=task_id,
                actor_id=user_id,
                action=ATTACHMENT_UPLOADED,
                message=f"{len(saved_names)} attachment(s) uploaded",
                meta={"files": saved_names},
            )

        assignee = get_user_email_name(assigned_to)

        def _send_mail():
            try:
                if assignee and assignee.get("email"):
                    send_task_assigned_email(
                        email=assignee["email"],
                        assignee_name=assignee.get("name"),
                        task_id=task_id,
                        title=title,
                        due_date=str(due_date) if due_date else None,
                        description=description or None,
                        attachment_paths=saved_paths,
                    )
            except Exception as e:
                print("ASSIGNEE MAIL ERROR:", str(e))

        transaction.on_commit(_send_mail)

        return JsonResponse(
            {"message": "Task created ✅", "task": task},
            status=201
        )

    except Exception as e:
        return JsonResponse({"message": "Failed to create task", "detail": str(e)}, status=400)


@csrf_exempt
@require_methods(["POST"])
@require_auth
@json_required
def _tasks_create_json(request, body):
    user_id = request.user_id

    serializer = TaskCreateSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400,
        )

    data = serializer.validated_data
    title = data["title"]
    description = data.get("description")
    assigned_to = data["assigned_to"]
    project_id = data["project_id"]
    status = data.get("status", "PENDING")
    due_date = data.get("due_date")

    assigned_by = user_id

    try:
        task = tasks_db.create_task_with_project(
            title=title,
            description=description or None,
            status=status,
            assigned_by=assigned_by,
            assigned_to=assigned_to,
            due_date=due_date,
            project_id=project_id,
        )

        log_activity(
            task_id=task["id"],
            actor_id=user_id,
            action=TASK_CREATED,
            message=f"Task created: {title}",
            meta={
                "title": title,
                "assigned_to": assigned_to,
                "project_id": project_id,
                "status": status,
                "due_date": str(due_date) if due_date else None,
            },
        )

        assignee = get_user_email_name(assigned_to)

        def _send_mail():
            try:
                if assignee and assignee.get("email"):
                    send_task_assigned_email(
                        email=assignee["email"],
                        assignee_name=assignee.get("name"),
                        task_id=task["id"],
                        title=title,
                        due_date=str(due_date) if due_date else None,
                        description=description or None,
                    )
            except Exception as e:
                print("ASSIGNEE MAIL ERROR:", str(e))

        transaction.on_commit(_send_mail)

        return JsonResponse(
            {"message": "Task created ✅", "task": task},
            status=201
        )

    except Exception as e:
        return JsonResponse({"message": "Failed to create task", "detail": str(e)}, status=400)


# =========================
# TASK BY ID (GET / PUT / PATCH / DELETE)
# =========================
@csrf_exempt
@require_methods(["GET", "PUT", "PATCH", "DELETE"])
@require_auth
def task_by_id(request, task_id: int):
    role = request.role
    user_id = request.user_id

    # ---------- GET ----------
    if request.method == "GET":
        try:
            task = ts.get_task(role, user_id, task_id)
            if not task:
                return JsonResponse({"message": "Task not found"}, status=404)
            return JsonResponse({"task": task}, status=200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)

    # ---------- PUT/PATCH ----------
    if request.method in ["PUT", "PATCH"]:
        @json_required
        def _handler(req, body):
            return _task_update(req, body, task_id)

        return _handler(request)

    # ---------- DELETE ----------
    if request.method == "DELETE":
        if role != "ADMIN":
            return JsonResponse({"message": "Forbidden"}, status=403)

        try:
            try:
                log_activity(
                    task_id=task_id,
                    actor_id=user_id,
                    action=TASK_DELETED,
                    message="Task deleted",
                )
            except Exception:
                pass

            tasks_db.delete_task(task_id)
            return JsonResponse({"message": "Task deleted ✅"}, status=200)

        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)


@csrf_exempt
@require_methods(["PUT", "PATCH"])
@require_auth
def _task_update(request, body, task_id: int):
    if request.role != "ADMIN":
        return JsonResponse({"message": "Forbidden"}, status=403)

    serializer = TaskUpdateSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400,
        )

    data = serializer.validated_data
    title = data["title"]
    description = data.get("description")
    status = data["status"]
    assigned_to = data["assigned_to"]
    due_date = data.get("due_date")

    try:
        old = tasks_db.get_task_old_values(task_id)
        if not old:
            return JsonResponse({"message": "Task not found"}, status=404)

        old_title, old_desc, old_status, old_assigned_to, old_due = old

        tasks_db.update_task_admin(task_id, title, description, status, assigned_to, due_date)

        actor_id = request.user_id
        meta = {
            "old": {
                "title": old_title,
                "description": old_desc,
                "status": old_status,
                "assigned_to": old_assigned_to,
                "due_date": str(old_due) if old_due else None,
            },
            "new": {
                "title": title,
                "description": description,
                "status": status,
                "assigned_to": assigned_to,
                "due_date": str(due_date) if due_date else None,
            },
        }

        if old_status != status:
            log_activity(
                task_id,
                actor_id,
                STATUS_CHANGED,
                message=f"Status changed {old_status} → {status}",
                meta=meta,
            )
        else:
            log_activity(
                task_id,
                actor_id,
                TASK_UPDATED,
                message="Task updated",
                meta=meta,
            )

        return JsonResponse({"message": "Task updated ✅"}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"message": "Task update failed", "detail": str(e)}, status=500)


# =========================
# USER: UPDATE OWN TASK STATUS
# =========================
@csrf_exempt
@require_methods(["PATCH", "PUT"])
@require_auth
@json_required
def update_my_task_status(request, body, task_id: int):
    role = request.role
    user_id = request.user_id

    if role != "USER":
        return JsonResponse({"message": "Only users can update task status here"}, status=403)

    serializer = TaskStatusUpdateSerializer(data=body)
    if not serializer.is_valid():
        return JsonResponse(
            {"message": "Validation error", "errors": serializer.errors},
            status=400,
        )

    status = serializer.validated_data["status"]

    try:
        old_status = tasks_db.get_task_status_for_user(task_id, user_id)
        if old_status is None:
            return JsonResponse({"message": "Forbidden"}, status=403)

        tasks_db.user_update_task_status(task_id, user_id, status)

        if old_status != status:
            log_activity(
                task_id=task_id,
                actor_id=user_id,
                action=STATUS_CHANGED,
                message=f"Status changed {old_status} → {status}",
                meta={"old": {"status": old_status}, "new": {"status": status}},
            )
        else:
            log_activity(
                task_id=task_id,
                actor_id=user_id,
                action=TASK_UPDATED,
                message="Status updated",
                meta={"status": status},
            )

        return JsonResponse({"message": "Status updated"}, status=200)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


@csrf_exempt
@require_methods(["POST"])
@require_auth
@json_required
def create_task(request, body):
    try:
        print("=== CREATE TASK VIEW HIT ===")
        print("BODY:", body)
        print("ACTOR ID:", getattr(request, "user_id", None))

        actor_id = request.user_id

        result = ts.create_task_service(body, actor_id)
        print("CREATE TASK RESULT:", result)

        if not result["ok"]:
            if "errors" in result:
                return JsonResponse({"errors": result["errors"]}, status=400)
            return JsonResponse({"message": result["message"]}, status=400)

        return JsonResponse({
            "message": "Task created successfully",
            "task": result["task"]
        }, status=201)

    except Exception as e:
        print("CREATE TASK VIEW ERROR:", repr(e))
        return JsonResponse({"message": str(e)}, status=500)


@csrf_exempt
@require_methods(["PUT"])
@require_auth
@json_required
def update_task(request, task_id, body):
    actor_id = request.user_id

    result = ts.update_task_service(task_id, body, actor_id)
    if not result["ok"]:
        if "errors" in result:
            return JsonResponse({"errors": result["errors"]}, status=400)
        return JsonResponse({"message": result["message"]}, status=404)

    return JsonResponse({
        "message": "Task updated successfully",
        "task": result["task"]
    }, status=200)