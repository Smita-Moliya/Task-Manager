import { useEffect, useState, useCallback } from "react";
import {
  FiAlignLeft,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMessageSquare,
  FiPaperclip,
  FiHash,
  FiX,
} from "react-icons/fi";
import { api } from "../../api/api";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import { Task, TaskStatus } from "../../types/task";
import "../../css/taskDetailModal.css";

type Props = {
  open: boolean;
  taskId: number | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function TaskDetailModal({
  open,
  taskId,
  onClose,
  onChanged,
}: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [msg, setMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔄 Refresh attachments/comments
  const refreshChildren = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // 🧹 Reset modal state
  const resetState = useCallback(() => {
    setTask(null);
    setStatus("PENDING");
    setMsg("");
    setBusy(false);
  }, []);

  // 📅 Format date nicely
  const formatDueDate = (value?: string | null) => {
    if (!value) return "No due date";

    const date = new Date(value);
    if (isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 📥 Load task
  const load = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    setMsg("");

    try {
      const res = await api.get(`/tasks/${taskId}/`);
      const t = (res.data?.task ?? res.data) as Task;

      setTask(t);
      setStatus(t.status);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Failed to load task");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // 🔁 Handle open/close
  useEffect(() => {
    if (open && taskId) {
      load();
    } else {
      resetState();
    }
  }, [open, taskId, load, resetState]);

  // ⌨️ ESC close
  useEffect(() => {
    if (!open) return;

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // 🔄 Update status
  async function updateStatus(next: TaskStatus) {
    if (!taskId || !task) return;
    if (next === status) return; // 🚫 avoid unnecessary API calls

    setBusy(true);
    setMsg("");

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

  function getStatusLabel(value: TaskStatus) {
    if (value === "IN_PROGRESS") return "In Progress";
    if (value === "DONE") return "Done";
    return "Pending";
  }

  function getStatusTone(value: TaskStatus) {
    if (value === "IN_PROGRESS") return "progress";
    if (value === "DONE") return "done";
    return "pending";
  }

  if (!open) return null;

  return (
    <div className="taskDetailOverlay" onClick={onClose}>
      <div
        className="taskDetailModal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        aria-busy={loading || busy}
      >
        {/* HEADER */}
        <div className="taskDetailHeader">
          <div className="taskDetailHeaderLeft">
            <div className={`taskDetailStatusPill ${getStatusTone(status)}`}>
              <FiCheckCircle />
              <span>{getStatusLabel(status)}</span>
            </div>

            <div className="taskDetailTitleWrap">
              <h2 id="task-detail-title" className="taskDetailTitle">
                {task ? task.title : "Task Details"}
              </h2>

              <div className="taskDetailMetaLine">
                <span className="taskDetailMetaChip">
                  <FiHash />
                  Task #{taskId}
                </span>
              </div>
            </div>
          </div>

          <button
            className="taskDetailCloseBtn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* ALERT */}
        {msg && (
          <div
            className={`taskDetailAlert ${
              msg.toLowerCase().includes("updated") ? "ok" : "bad"
            }`}
          >
            {msg}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="taskDetailLoading">
            <FiLoader className="taskDetailSpinner" />
            <span>Loading task details...</span>
          </div>
        ) : !task ? (
          <div className="taskDetailLoading">
            <span>Task not found.</span>
          </div>
        ) : (
          <>
            {/* INFO GRID */}
            <div className="taskDetailInfoGrid">
              <section className="taskDetailInfoCard taskDetailInfoCardWide">
                <div className="taskDetailSectionHead">
                  <span className="taskDetailSectionIcon">
                    <FiAlignLeft />
                  </span>
                  <div>
                    <h3>Description</h3>
                    <p>Task summary and details</p>
                  </div>
                </div>

                <div className="taskDetailDescription">
                  {task.description?.trim() ||
                    "No description added for this task."}
                </div>
              </section>

              <section className="taskDetailInfoCard">
                <div className="taskDetailSectionHead">
                  <span className="taskDetailSectionIcon">
                    <FiCalendar />
                  </span>
                  <div>
                    <h3>Due Date</h3>
                    <p>Deadline for this task</p>
                  </div>
                </div>

                <div className="taskDetailValue">
                  {formatDueDate(task.due_date)}
                </div>
              </section>

              <section className="taskDetailInfoCard">
                <div className="taskDetailSectionHead">
                  <span className="taskDetailSectionIcon">
                    <FiClock />
                  </span>
                  <div>
                    <h3>Status</h3>
                    <p>Update current progress</p>
                  </div>
                </div>

                <div className="taskDetailStatusRow">
                  <select
                    className="taskDetailSelect"
                    value={status}
                    disabled={busy}
                    onChange={(e) =>
                      updateStatus(e.target.value as TaskStatus)
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>

                  {busy && (
                    <span className="taskDetailSaving">
                      <FiLoader className="taskDetailSpinner" />
                      Saving...
                    </span>
                  )}
                </div>
              </section>
            </div>

            {/* ATTACHMENTS */}
            <section className="taskDetailBlock">
              <div className="taskDetailBlockHead">
                <div className="taskDetailBlockTitle">
                  <span className="taskDetailBlockIcon">
                    <FiPaperclip />
                  </span>
                  <div>
                    <h3>Attachments</h3>
                    <p>Upload and manage task files</p>
                  </div>
                </div>
              </div>

              <div className="taskDetailBlockBody">
                <TaskAttachments
                  taskId={task.id}
                  reloadKey={reloadKey}
                  onUploaded={refreshChildren}
                />
              </div>
            </section>

            {/* COMMENTS */}
            <section className="taskDetailBlock">
              <div className="taskDetailBlockHead">
                <div className="taskDetailBlockTitle">
                  <span className="taskDetailBlockIcon">
                    <FiMessageSquare />
                  </span>
                  <div>
                    <h3>Comments</h3>
                    <p>Discuss updates and leave notes</p>
                  </div>
                </div>
              </div>

              <div className="taskDetailBlockBody">
                <TaskComments
                  taskId={task.id}
                  reloadKey={reloadKey}
                  onCommented={refreshChildren}
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}