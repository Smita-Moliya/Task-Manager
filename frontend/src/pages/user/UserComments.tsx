import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { CommentRow } from "../../types/dashboard";
import UserPageHeader from "../../pages/user/UserPageHeader";
import ThemeToggle from "../../components/ThemeToggle";
import "../../css/userComments.css";

type Task = {
  id: number;
  title: string;
};

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
      const mapped = (Array.isArray(list) ? list : []).map((x: any) => ({
        id: x.id,
        title: x.title,
      }));
      setTasks(mapped);
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
      `${c.comment} ${c.task_id} ${c.task_title || ""} ${c.user_name}`
        .toLowerCase()
        .includes(s)
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
    <div className="commentsPage">
      {msg ? (
        <div
          className={`commentsAlert ${
            msg.includes("✅") ? "success" : "error"
          }`}
        >
          {msg}
        </div>
      ) : null}

      <UserPageHeader
        eyebrow="DISCUSSIONS"
        title="Comments"
        subtitle="Read conversations, follow updates, and add your comments to stay aligned with the team."
        rightSlot={<ThemeToggle />}
      />

      <section className="commentsCard">
        <div className="commentsCardHead">
          <h3>Add Comment</h3>
          <span className="commentsChip">Task based</span>
        </div>

        <div className="commentInputRow">
          <select
            className="commentsInput commentsSelect"
            value={taskId}
            onChange={(e) =>
              setTaskId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Select task...</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title}
              </option>
            ))}
          </select>

          <input
            className="commentsInput commentsCommentBox"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your comment..."
          />

          <button
            className="commentsBtnPrimary"
            onClick={addComment}
            disabled={posting}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="commentsNote">
          Note: comment will be added to the selected task.
        </div>
      </section>

      <div className="commentsSearchRow">
        <input
          className="commentsInput commentsSearchInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search comment / task / user..."
        />
        <button className="commentsBtnGhost" onClick={loadComments}>
          Refresh
        </button>
      </div>

      {loading ? <div className="commentsMuted">Loading...</div> : null}

      <section className="commentsCard">
        <div className="commentsCardHead">
          <h3>All Comments</h3>
          <span className="commentsChip">{filtered.length}</span>
        </div>

        <div className="commentList">
          {filtered.length === 0 ? (
            <div className="commentsMuted">No comments found.</div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="commentItem">
                <div className="commentTop">
                  <div className="commentTitle">
                    #{c.task_id}
                    {c.task_title ? ` — ${c.task_title}` : ""}
                  </div>

                  <div className="commentDate">
                    {c.created_at
                      ? String(c.created_at).slice(0, 16).replace("T", " ")
                      : "—"}
                  </div>
                </div>

                <div className="commentUser">By {c.user_name}</div>

                <div className="commentText">{c.comment}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}