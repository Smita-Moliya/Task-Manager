from api.db.analytics_db import get_project_analytics


def project_analytics_service():
    data = get_project_analytics()
    return {"ok": True, "data": data}