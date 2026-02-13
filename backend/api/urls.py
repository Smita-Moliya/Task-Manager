from django.urls import path
from .views import  login, create_user, list_users, tasks, task_by_id, update_my_task_status
from .views import get_task, admin_update_task, admin_delete_task

urlpatterns = [
    path("auth/login/", login),

    path("users/create/", create_user),
    path("users/", list_users),

    path("tasks/", tasks),                 # GET (admin/user), POST (admin)
    path("tasks/<int:task_id>/", task_by_id),  
    path("tasks/<int:task_id>/status/", update_my_task_status),
    path("tasks/<int:task_id>/one/", get_task),          # GET single task (admin only)
    path("tasks/<int:task_id>/admin/", admin_update_task), # PATCH (admin)
    path("tasks/<int:task_id>/admin/delete/", admin_delete_task), # DELETE (admin)
]
