from django.conf import settings
from django.core.mail import send_mail, EmailMessage
from typing import Iterable, Optional
import os
def send_set_password_email(email: str, raw_token: str):
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
        print("EMAIL SEND FAILED:", str(e))
        print("PASSWORD SETUP LINK (DEV):", link)
        return {"ok": False, "link": link, "error": str(e)}
    




def send_task_assigned_email(
    *,
    email: str,
    assignee_name: str | None,
    task_id: int,
    title: str,
    due_date: str | None = None,
    description: str | None = None,
    attachment_paths: Optional[Iterable[str]] = None,  #  new
):
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend}/user/tasks?task={task_id}"

    name = assignee_name or "there"
    due_line = f"Due date: {due_date}" if due_date else "Due date: Not set"

    message = (
        f"Hi {name},\n\n"
        f"A new task has been assigned to you.\n\n"
        f"Title: {title}\n"
        f"{due_line}\n"
        f"{('Description: ' + description.strip() + '\\n') if description and description.strip() else ''}\n"
        f"Open task: {link}\n\n"
        f"Thanks,\nTask Management System"
    )

    try:
        mail = EmailMessage(
            subject=f"New Task Assigned: {title}",
            body=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@taskapp.local"),
            to=[email],
        )

        #  attach files (if any)
        for p in (attachment_paths or []):
            try:
                if p and os.path.exists(p):
                    mail.attach_file(p)
            except Exception as ex:
                print("ATTACH FILE FAILED:", p, str(ex))

        mail.send(fail_silently=False)
        return {"ok": True}
    except Exception as e:
        print("TASK EMAIL FAILED:", str(e))
        return {"ok": False, "error": str(e)}