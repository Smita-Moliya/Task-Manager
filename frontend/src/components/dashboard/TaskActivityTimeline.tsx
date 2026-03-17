import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";

type ActivityItem = {
  id: number;
  task_id: number;
  actor_id: number | null;
  actor_name?: string;
  action: string;
  message: string | null;
  meta?: any;
  created_at: string | null;
};

function actionLabel(action: string) {
  const map: Record<string, string> = {
    TASK_CREATED: "Task Created",
    TASK_UPDATED: "Task Updated",
    STATUS_CHANGED: "Status Changed",
    TASK_DELETED: "Task Deleted",
    COMMENT_ADDED: "Comment Added",
    COMMENT_DELETED: "Comment Deleted",
    ATTACHMENT_UPLOADED: "Attachment Uploaded",
    ATTACHMENT_DELETED: "Attachment Deleted",
  };
  return map[action] || action;
}

function safeDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function relativeTime(iso?: string | null) {
  const d = safeDate(iso);
  if (!d) return "";
  const diffMs = d.getTime() - Date.now();
  const sec = Math.round(diffMs / 1000);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(sec, "second");
  const min = Math.round(sec / 60);
  if (Math.abs(min) < 60) return rtf.format(min, "minute");
  const hr = Math.round(min / 60);
  if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
  const day = Math.round(hr / 24);
  return rtf.format(day, "day");
}

export default function TaskActivityTimeline({
  taskId,
  reloadKey,
  enabled = true, //  parent controls whether it should fetch
}: {
  taskId: number;
  reloadKey: number;
  enabled?: boolean;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!enabled) return;

    setMsg("");
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${taskId}/activity/`, {
        params: { page: 1, page_size: 50 },
      });

      //  backend returns { results, page, total, ... }
      const list = res.data?.results ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled) return; // prevents 401 calls on user dashboard
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, reloadKey, enabled]);

  const ui = useMemo(() => {
    if (!enabled) return null;
    if (loading) return <div className="muted">Loading activity…</div>;
    if (msg) return <div className="alert error">{msg}</div>;
    if (!items.length) return <div className="muted">No activity yet</div>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((a) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 10,
              background: "#fff",
            }}
          >
            <div
              className="muted small"
              style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
            >
              <div>
                <b>{a.actor_name || (a.actor_id ? `User #${a.actor_id}` : "System")}</b> •{" "}
                {actionLabel(a.action)}
              </div>
              <div title={a.created_at || ""}>
                {relativeTime(a.created_at) ||
                  (safeDate(a.created_at)?.toLocaleString() ?? "")}
              </div>
            </div>

            {a.message ? <div style={{ marginTop: 6 }}>{a.message}</div> : null}
          </div>
        ))}
      </div>
    );
  }, [items, loading, msg, enabled]);

  if (!enabled) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div className="label">Timeline</div>
        <button className="btn" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      <div style={{ marginTop: 10 }}>{ui}</div>
    </div>
  );
}