from django.urls import path
from .views import (login, 
                    create_user, 
                    list_users, logout, 
                    tasks, task_by_id, 
                    update_my_task_status, 
                    set_password_from_token, 
                    send_reset_link,delete_user,
                    refresh_access_token,
                    download_attachment,
                    admin_stats
                    )

urlpatterns = [
    path("auth/login/", login),

    path("users/create/", create_user),
    path("users/", list_users),

    path("tasks/", tasks),                 
    path("tasks/<int:task_id>/", task_by_id),  
    path("tasks/<int:task_id>/status/", update_my_task_status),
    path("auth/set-password/", set_password_from_token),
    path("auth/send-reset-link/", send_reset_link),
    path("users/<int:user_id>/delete/", delete_user),
    
    path("auth/refresh/", refresh_access_token),
    path("auth/logout/", logout),

    path("attachments/<int:att_id>/download/", download_attachment),
    path("admin/stats/", admin_stats),

]
