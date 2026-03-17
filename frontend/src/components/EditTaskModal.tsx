import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { Task, TaskStatus } from "../types/task";
import { ModalProps } from "../types/user";

function toDateInputValue(due: string | null) {
  if (!due) return "";
  return String(due).slice(0, 10);
}

function normalizeStatus(status?: string | null): TaskStatus {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "DONE") return "DONE";
  return "PENDING";
}

async function fetchTask(taskId: number): Promise<Task> {
  const res = await api.get(`/tasks/${taskId}/`);
  return (res.data?.task || res.data) as Task;
}

async function updateTask(taskId: number, payload: any) {
  return api.put(`/tasks/${taskId}/`, payload);
}

export default function EditTaskModal({
  open,
  taskId,
  users,
  onClose,
  onSaved,
}: ModalProps) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | "">("");
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);

  const userOptions = useMemo(
    () => users.filter((u) => u.role === "USER"),
    [users]
  );

  useEffect(() => {
    if (!open || !taskId) return;

    const run = async () => {
      setBusy(true);
      setMsg("");

      try {
        const t = await fetchTask(taskId);
        setTitle(t.title || "");
        setAssignedTo(t.assigned_to ?? "");
        setStatus(normalizeStatus(t.status));
        setDueDate(toDateInputValue(t.due_date || ""));
        setDescription(t.description || "");
        setProjectName(t.project_name || "");
        setProjectId(t.project_id ?? null);
      } catch (err: any) {
        setMsg(err?.response?.data?.message || "Failed to load task");
      } finally {
        setBusy(false);
      }
    };

    run();
  }, [open, taskId]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !taskId) return null;

  const save = async () => {
    if (!title.trim()) {
      setMsg("Title is required");
      return;
    }

    if (assignedTo === "") {
      setMsg("Please select a user");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      const payload = {
        title: title.trim(),
        assigned_to: Number(assignedTo),
        status,
        due_date: dueDate || null,
        description: description.trim() || null,
      };

      await updateTask(taskId, payload);

      setMsg("Saved ✅");
      onSaved();
      setTimeout(() => onClose(), 250);
    } catch (err: any) {
      const statusCode = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.detail;
      setMsg(serverMsg || `Save failed (HTTP ${statusCode || "?"})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHead">
          <div>
            <h3 className="modalTitle">Edit Task</h3>
            <div className="modalSub">Update task info and save changes</div>
          </div>
          <button className="modalIconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {msg ? (
          <div className={`modalAlert ${msg.includes("✅") ? "ok" : "bad"}`}>
            {msg}
          </div>
        ) : null}

        <div className="editForm">
          <div className="editField">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="editField">
            <label>Project</label>
            <input
              value={
                projectName
                  ? `${projectName}${projectId ? ` (#${projectId})` : ""}`
                  : "No project linked"
              }
              disabled
            />
          </div>

          <div className="editField">
            <label>Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Select user</option>
              {userOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="editField">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div className="editField">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="editField full">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modalActions">
            <button className="modalBtn ghost" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button className="modalBtn primary" onClick={save} disabled={busy}>
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}