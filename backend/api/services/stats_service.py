from typing import Dict, Any
from api.db import stats_db


def get_admin_stats() -> Dict[str, Any]:
    status_rows = stats_db.admin_stats_by_status()
    user_rows = stats_db.admin_stats_by_user()

    by_status = [{"status": r[0], "count": r[1]} for r in status_rows]
    by_user = [{"name": r[0], "count": r[1]} for r in user_rows]

    return {"by_status": by_status, "by_user": by_user}