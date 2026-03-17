from django.urls import path

from api.views.auth import login, refresh_access_token, logout
from api.views.users import create_user, list_users, send_reset_link, set_password_from_token, delete_user, update_user
from api.views.tasks import tasks, task_by_id, update_my_task_status, create_task, update_task
from api.views.attachments import download_attachment, task_attachments
from api.views.comments import task_comments, me_attachments, me_comments
from api.views.stats import admin_stats
from api.views.googleAuth import google_auth
from api.views.admin_activity import admin_activity
from api.views.activity import task_activity, my_activity
from api.views.project_views import (
    create_project,
    list_projects,
    get_project,
    update_project,
    delete_project,
)
from api.views.project_member_views import (
    list_project_members,
    add_project_members,
    remove_project_member,
)
from api.views.analytics_views import project_analytics

urlpatterns = [

    # --- AUTH ---
    path("auth/login/", login),
    path("auth/refresh/", refresh_access_token),
    path("auth/logout/", logout),
    path("auth/send-reset-link/", send_reset_link),
    path("auth/set-password/", set_password_from_token),
    path("auth/google/", google_auth),

    # --- USERS ---
    path("users/", list_users),
    path("users/create/", create_user),
    path("users/<int:user_id>/update/", update_user),
    path("users/<int:user_id>/delete/", delete_user),

    # --- ME ---
    path("me/attachments/", me_attachments),
    path("me/comments/", me_comments),
    path("my-activity/", my_activity),

    # --- ADMIN ---
    path("admin/stats/", admin_stats),
    path("admin/activity/", admin_activity),

    # --- PROJECTS ---
    path("projects/", list_projects),
    path("projects/create/", create_project),
    path("projects/<int:project_id>/", get_project),
    path("projects/<int:project_id>/update/", update_project),
    path("projects/<int:project_id>/delete/", delete_project),
    path("projects/<int:project_id>/members/", list_project_members),
    path("projects/<int:project_id>/members/add/", add_project_members),
    path("projects/<int:project_id>/members/<int:user_id>/remove/", remove_project_member),

    # --- ANALYTICS ---
    path("analytics/projects/", project_analytics),

    # --- TASKS ---
    path("tasks/", tasks),
    path("tasks/create/", create_task),
    path("tasks/<int:task_id>/", task_by_id),
    path("tasks/<int:task_id>/update/", update_task),
    path("tasks/<int:task_id>/status/", update_my_task_status),
    path("tasks/<int:task_id>/attachments/", task_attachments),
    path("tasks/<int:task_id>/comments/", task_comments),
    path("tasks/<int:task_id>/activity/", task_activity),

    # --- ATTACHMENTS ---
    path("attachments/<int:att_id>/download/", download_attachment),

]