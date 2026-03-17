import { useEffect, useState } from "react";
import { api } from "../../api/api";

type LogRow = {
  id: number;
  task_id: number;
  actor_id: number | null;
  actor_name: string;
  action: string;
  message: string;
  meta: any;
  created_at: string | null;
};

export default function AdminTaskActivity({ taskId }: { taskId: number }) {
  const [items, setItems] = useState<LogRow[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const res = await api.get(`/tasks/${taskId}/activity/?page=1&page_size=50`);
      setItems(res.data?.results || []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load activity");
    }
  }

  useEffect(() => {
    load();
  }, [taskId]);

  return (
    <div>
      {msg ? <div className="alert error">{msg}</div> : null}

      {items.length === 0 ? (
        <div className="muted">No activity yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((x) => (
            <div key={x.id} style={{ padding: 10, border: "1px solid #eee", borderRadius: 12 }}>
              <div className="muted" style={{ fontSize: 12 }}>
                <b>{x.actor_name}</b> • {x.action}
                {x.created_at ? ` • ${new Date(x.created_at).toLocaleString()}` : ""}
              </div>
              <div>{x.message || "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}