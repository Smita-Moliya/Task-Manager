import type { Task } from "../../types/task";
import { FiCalendar, FiFolder } from "react-icons/fi";
import "../../css/userTask.css";

function prettyDue(due?: string) {
  if (!due) return "No due date";
  const d = new Date(String(due).slice(0, 10));
  if (isNaN(d.getTime())) return String(due).slice(0, 10);
  return d.toLocaleDateString();
}

function dueTone(due?: string | null, status?: string) {
  if (!due || status === "DONE") return "neutral";
  const d = new Date(due);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((dueDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "danger";
  if (diff === 0) return "warning";
  return "info";
}

function dueText(due?: string | null, status?: string) {
  if (!due) return "No due date";
  if (status === "DONE") return "Completed";

  const d = new Date(due);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((dueDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `${diff} days left`;
}

function statusInfo(status: Task["status"]) {
  if (status === "DONE") return { label: "Done", cls: "uiStatusDone" };
  if (status === "IN_PROGRESS") return { label: "In Progress", cls: "uiStatusProgress" };
  return { label: "Pending", cls: "uiStatusPending" };
}

export default function TaskList({
  tasks,
  onOpen,
}: {
  tasks: Task[];
  onOpen: (t: Task) => void;
}) {
  if (!tasks.length) {
    return (
      <div className="uiEmpty">
        <div className="uiEmptyTitle">No tasks found</div>
        <div className="uiEmptyText">Try clearing filters or switching tabs.</div>
      </div>
    );
  }

  return (
    <div className="taskGrid upgradedTaskGrid">
      {tasks.map((t) => {
        const badge = statusInfo(t.status);
        const tone = dueTone(t.due_date, t.status);

        return (
          <button
            key={t.id}
            type="button"
            className={`taskCard upgradedTaskCard due-${tone}`}
            onClick={() => onOpen(t)}
          >
            <div className="taskCardTop">
              <div className="taskCardTitleWrap">
                <div className="taskTitle">{t.title}</div>
                <div className="taskSubMeta">
                  <span className={`uiBadge ${badge.cls} taskBadge`}>{badge.label}</span>
                  <span className="taskProjectPill">
                    <FiFolder />
                    {t.project_name || "General"}
                  </span>
                </div>
              </div>
            </div>

            <div className="taskDesc">{t.description || "No description added."}</div>

            <div className="taskMetaStack">
              <div className={`taskDuePill tone-${tone}`}>
                <FiCalendar />
                <span>{dueText(t.due_date, t.status)}</span>
              </div>

              <div className="taskMeta">
                <div className="taskDue">
                  Due: <b>{prettyDue(t.due_date ?? undefined)}</b>
                </div>
                <div className="taskId">#{t.id}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}