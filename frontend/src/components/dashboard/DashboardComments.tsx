import { useEffect, useState } from "react";
import { api } from "../../api/api";
import { CommentRow } from "../../types/dashboard";


export default function DashboardComments({ taskId }: { taskId: number }) {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api.get(`/tasks/${taskId}/comments/`);
      setItems(res.data?.comments || []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load comments");
    }
  }

  useEffect(() => {
    setMsg("");
    load();
  }, [taskId]);

  async function send() {
    const c = text.trim();
    if (!c) return setMsg("Comment is required");

    setMsg("");
    setBusy(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments/`, { comment: c });
      setMsg(res.data?.message || "Comment added ✅");
      setText("");
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to add comment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {msg ? (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>{msg}</div>
      ) : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          className="input"
          value={text}
          placeholder="Write a comment..."
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn" onClick={send} disabled={busy}>
          {busy ? "Sending..." : "Send"}
        </button>
        <button className="btn" onClick={load} disabled={busy}>Refresh</button>
      </div>

      <div style={{ marginTop: 10 }}>
        {items.length === 0 ? (
          <div className="muted">No comments</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((c) => (
              <div key={c.id} style={{ padding: 10, border: "1px solid #eee", borderRadius: 12 }}>
                <div className="muted" style={{ fontSize: 12 }}>
                  <b>{c.user_name}</b> {c.created_at ? `• ${c.created_at}` : ""}
                </div>
                <div>{c.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
