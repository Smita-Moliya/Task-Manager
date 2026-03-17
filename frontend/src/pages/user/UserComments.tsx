import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { CommentRow } from "../../types/dashboard";
type Task = { id: number; title: string };

export default function UserComments() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<number | "">("");
  const [text, setText] = useState("");

  const [items, setItems] = useState<CommentRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  async function loadTasks() {
    try {
      const res = await api.get("/tasks/");
      const list = Array.isArray(res.data) ? res.data : res.data?.tasks || [];
      const t = (Array.isArray(list) ? list : []).map((x: any) => ({ id: x.id, title: x.title }));
      setTasks(t);
    } catch {
      setTasks([]);
    }
  }

  async function loadComments() {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/me/comments/");
      const list = res.data?.comments ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    loadComments();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      `${c.comment} ${c.task_id} ${c.task_title || ""} ${c.user_name}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  async function addComment() {
    setMsg("");

    if (!taskId) {
      setMsg("Please select a task first.");
      return;
    }
    const comment = text.trim();
    if (!comment) {
      setMsg("Comment is required.");
      return;
    }

    setPosting(true);
    try {
      await api.post(`/tasks/${taskId}/comments/`, { comment });
      setMsg("Comment added ✅");
      setText("");
      setTaskId(""); 
      await loadComments();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to add comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      {msg ? (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`} style={{ marginBottom: 12 }}>
          {msg}
        </div>
      ) : null}

      {/* ✅ Add Comment Box */}
      <section className="adminCard" style={{ marginBottom: 14 }}>
        <div className="adminCardHead">
          <h3>Add Comment</h3>
          <span className="adminChip">Task based</span>
        </div>

        <div className="adminCardBody">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              className="input"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : "")}
              style={{ minWidth: 260 }}
            >
              <option value="">Select task…</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} — {t.title}
                </option>
              ))}
            </select>

            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your comment…"
              style={{ flex: 1, minWidth: 260 }}
            />

            <button className="adminBtn adminBtnPrimary" onClick={addComment} disabled={posting}>
              {posting ? "Posting…" : "Post"}
            </button>
          </div>

          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            Note: comment will be added to the selected task.
          </div>
        </div>
      </section>

      {/* Search + Refresh */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search comment / task title / task id / user name…"
          style={{ flex: 1 }}
        />
        <button className="adminBtn adminBtnGhost" onClick={loadComments}>
          Refresh
        </button>
      </div>

      {loading ? <div className="muted" style={{ padding: 10 }}>Loading…</div> : null}

      {/* List */}
      <section className="adminCard">
        <div className="adminCardHead">
          <h3>All Comments</h3>
          <span className="adminChip">{filtered.length}</span>
        </div>

        <div className="adminCardBody">
          {filtered.length === 0 ? (
            <div className="muted">No comments found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((c) => (
                <div key={c.id} className="adminCard" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>
                      #{c.task_id}{c.task_title ? ` — ${c.task_title}` : ""}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {c.created_at ? String(c.created_at).slice(0, 16).replace("T", " ") : "—"}
                    </div>
                  </div>

                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    By: {c.user_name}
                  </div>

                  <div style={{ marginTop: 10 }}>{c.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}