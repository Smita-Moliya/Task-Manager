from django.db import IntegrityError
from api.db import project_db, project_member_db

VALID_MEMBER_ROLES = {"LEAD", "DEVELOPER", "TESTER", "MEMBER"}


def add_project_members_service(*, request, project_id, data):
    if not project_db.project_exists(project_id):
        return {"ok": False, "message": "Project not found"}

    members = data.get("members")
    if not isinstance(members, list) or not members:
        return {"ok": False, "message": "members list is required"}

    added = []
    errors = []

    for item in members:
        print("ITEM:", item)

        if not isinstance(item, dict):
            errors.append({
                "user_id": None,
                "message": "Each member must be an object"
            })
            continue

        user_id = item.get("user_id")
        member_role = str(item.get("member_role") or "MEMBER").strip().upper()

        if not user_id:
            errors.append({"user_id": None, "message": "user_id is required"})
            continue

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            errors.append({"user_id": user_id, "message": "user_id must be a valid integer"})
            continue

        if member_role not in VALID_MEMBER_ROLES:
            errors.append({"user_id": user_id, "message": "Invalid member_role"})
            continue

        if project_member_db.is_user_in_project(project_id, user_id):
            errors.append({"user_id": user_id, "message": "User already in project"})
            continue

        try:
            row = project_member_db.add_project_member(project_id, user_id, member_role)
            print("ROW ADDED:", row)
            added.append(row)
        except IntegrityError as e:
            print("ADD MEMBER INTEGRITY ERROR:", repr(e))
            errors.append({"user_id": user_id, "message": "Could not add member"})
        except Exception as e:
            print("ADD PROJECT MEMBER SERVICE ERROR:", repr(e))
            raise

    return {"ok": True, "added": added, "errors": errors}


def list_project_members_service(*, project_id):
    if not project_db.project_exists(project_id):
        return {"ok": False, "message": "Project not found"}

    try:
        members = project_member_db.list_project_members(project_id)
        return {"ok": True, "members": members}
    except Exception as e:
        print("LIST PROJECT MEMBERS SERVICE ERROR:", repr(e))
        raise


def remove_project_member_service(*, request, project_id, user_id):
    if not project_db.project_exists(project_id):
        return {"ok": False, "message": "Project not found"}

    if not project_member_db.is_user_in_project(project_id, user_id):
        return {"ok": False, "message": "User is not in project"}

    deleted = project_member_db.remove_project_member(project_id, user_id)
    if not deleted:
        return {"ok": False, "message": "Could not remove member"}

    return {"ok": True}