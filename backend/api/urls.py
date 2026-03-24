from django.urls import path
from api.views.admin_dashboard import AdminDashboardView
from api.views.auth import LoginView, RefreshAccessTokenView, LogoutView
from api.views.users import (
    CreateUserView,
    ListUsersView,
    SendResetLinkView,
    SetPasswordFromTokenView,
    DeleteUserView,
    UpdateUserView,
)
from api.views.tasks import (
    MyTasksView,
    TaskByIdView,
    TasksView,
    UpdateMyTaskStatusView,
)
from api.views.comments import MeAttachmentsView, MeCommentsView, TaskCommentsView
from api.views.stats import admin_stats
from api.views.googleAuth import google_auth
from api.views.admin_activity import AdminActivityView
from api.views.activity import MyActivityView, TaskActivityView, MyActivityExportView
from api.views.project_views import ProjectListCreateView, ProjectDetailView
from api.views.project_member_views import (
    ProjectMemberListCreateView,
    ProjectMemberDeleteView,
)
from api.views.analytics_views import project_analytics
from api.views.user_project_views import (
    ListUserProjectsView,
    UserProjectDetailView,
    UserProjectTasksView,
    UserProjectMembersView,
    UserProjectActivityView,
)
from api.views.access_control import access_control_view
from api.views.admin_activity_export import AdminActivityExportView
from api.views.attachments import DownloadAttachmentView, TaskAttachmentsView

urlpatterns = [
    # --- AUTH ---
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", RefreshAccessTokenView.as_view(), name="refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/send-reset-link/", SendResetLinkView.as_view(), name="send-reset-link"),
    path("auth/set-password/", SetPasswordFromTokenView.as_view(), name="set-password"),
    path("auth/google/", google_auth),

    # --- USERS ---
    path("users/", ListUsersView.as_view(), name="list-users"),
    path("users/create/", CreateUserView.as_view(), name="create-user"),
    path("users/<int:user_id>/update/", UpdateUserView.as_view(), name="update-user"),
    path("users/<int:user_id>/delete/", DeleteUserView.as_view(), name="delete-user"),

    # --- ME ---
    path("me/attachments/", MeAttachmentsView.as_view(), name="me-attachments"),
    path("me/comments/", MeCommentsView.as_view(), name="me-comments"),
    path("my/activity/", MyActivityView.as_view(), name="my-activity"),
    path("my/activity/export/", MyActivityExportView.as_view(), name="my-activity-export"),

    # --- ADMIN ---
    path("admin/stats/", admin_stats),
    path("admin/activity/", AdminActivityView.as_view(), name="admin-activity"),
    path("admin/activity/export/", AdminActivityExportView.as_view(), name="admin-activity-export"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),

    # --- PROJECTS ---
    path("projects/", ProjectListCreateView.as_view(), name="project-list-create"),
    path("projects/create/", ProjectListCreateView.as_view(), name="project-create-legacy"),
    path("projects/<int:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:project_id>/update/", ProjectDetailView.as_view(), name="project-update-legacy"),
    path("projects/<int:project_id>/delete/", ProjectDetailView.as_view(), name="project-delete-legacy"),

    # --- PROJECT MEMBERS ---
    path(
        "projects/<int:project_id>/members/",
        ProjectMemberListCreateView.as_view(),
        name="project-members",
    ),
    path(
        "projects/<int:project_id>/members/<int:user_id>/",
        ProjectMemberDeleteView.as_view(),
        name="project-member-delete",
    ),

    # Legacy support
    path(
        "projects/<int:project_id>/members/add/",
        ProjectMemberListCreateView.as_view(),
        name="project-members-add-legacy",
    ),
    path(
        "projects/<int:project_id>/members/<int:user_id>/remove/",
        ProjectMemberDeleteView.as_view(),
        name="project-member-remove-legacy",
    ),

    # --- USER PROJECTS ---
    path("user/projects/", ListUserProjectsView.as_view(), name="user-project-list"),
    path("user/projects/<int:project_id>/", UserProjectDetailView.as_view(), name="user-project-detail"),
    path("user/projects/<int:project_id>/tasks/", UserProjectTasksView.as_view(), name="user-project-tasks"),
    path("user/projects/<int:project_id>/members/", UserProjectMembersView.as_view(), name="user-project-members"),
    path("user/projects/<int:project_id>/activity/", UserProjectActivityView.as_view(), name="user-project-activity"),

    # --- ANALYTICS ---
    path("analytics/projects/", project_analytics),

    # --- TASKS ---
    path("tasks/", TasksView.as_view(), name="tasks"),
    path("tasks/create/", TasksView.as_view(), name="create-task-compat"),
    path("user/tasks/", MyTasksView.as_view(), name="my-tasks"),
    path("tasks/<int:task_id>/", TaskByIdView.as_view(), name="task-by-id"),
    path("tasks/<int:task_id>/update/", TaskByIdView.as_view(), name="update-task-compat"),
    path("tasks/<int:task_id>/status/", UpdateMyTaskStatusView.as_view(), name="update-my-task-status"),

    path("tasks/<int:task_id>/attachments/", TaskAttachmentsView.as_view(), name="task-attachments"),
    path("attachments/<int:att_id>/download/", DownloadAttachmentView.as_view(), name="download-attachment"),

    path("tasks/<int:task_id>/comments/", TaskCommentsView.as_view(), name="task-comments"),
    path("tasks/<int:task_id>/activity/", TaskActivityView.as_view(), name="task-activity"),

    # --- ACCESS CONTROL ---
    path("access-control/", access_control_view, name="access-control"),

    path("my-activity/", MyActivityView.as_view(), name="my-activity"),

    path("admin/activity/export/", AdminActivityExportView.as_view(), name="admin-activity-export")
]