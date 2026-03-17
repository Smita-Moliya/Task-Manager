// src/components/dashboard/TaskDetailModal.tsx
import { useEffect, useState } from "react";
import { api } from "../../api/api";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import { Task, TaskStatus } from "../../types/task";

export default function TaskDetailModal({
  open,
  taskId,
  onClose,
  onChanged,
}: {
  open: boolean;
  taskId: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [msg, setMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);

  function refreshChildren() {
    setReloadKey((k) => k + 1);
  }

  async function load() {
    if (!taskId) return;
    setMsg("");
    setTask(null);
    try {
      const res = await api.get(`/tasks/${taskId}/`);
      const t = (res.data?.task ?? res.data) as Task;
      setTask(t);
      setStatus(t.status);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to load task");
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  async function updateStatus(next: TaskStatus) {
    if (!taskId) return;
    setMsg("");
    setBusy(true);
    try {
      await api.patch(`/tasks/${taskId}/status/`, { status: next });
      setStatus(next);
      await load();
      onChanged();
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      {/* use modalCard (matches your styles.css) */}
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modalHead">
          <div>
            <h3 className="modalTitle">{task ? task.title : "Task Details"}</h3>
            <div className="muted small">Task #{taskId}</div>
          </div>

          <button className="modalIconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {msg ? (
          <div className={`modalAlert ${msg.toLowerCase().includes("updated") ? "ok" : "bad"}`}>
            {msg}
          </div>
        ) : null}

        {!task ? (
          <div className="muted">Loading...</div>
        ) : (
          <>
            <div className="modalSection">
              <div className="label">Description</div>
              <div className="textBlock">{task.description || "—"}</div>
            </div>

            <div className="modalSection">
              <div className="label">Due Date</div>
              <div>{task.due_date ? new Date(task.due_date).toLocaleString() : "—"}</div>
            </div>

            <div className="modalSection">
              <div className="label">Status</div>
              <div className="row" style={{ gap: 10 }}>
                {/*  use input class so it gets styled */}
                <select
                  className="input"
                  value={status}
                  disabled={busy}
                  onChange={(e) => updateStatus(e.target.value as TaskStatus)}
                  style={{ maxWidth: 240 }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>

                {busy ? <span className="muted small">Saving…</span> : null}
              </div>
            </div>

            {/* Attachments (ONLY ONCE) */}
            <div className="modalSection">
              <div className="label">Attachments</div>
              <TaskAttachments taskId={task.id} reloadKey={reloadKey} onUploaded={refreshChildren} />
            </div>

            {/* Comments (ONLY ONCE) */}
            <div className="modalSection">
              <div className="label">Comments</div>
              <TaskComments taskId={task.id} reloadKey={reloadKey} onCommented={refreshChildren} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
