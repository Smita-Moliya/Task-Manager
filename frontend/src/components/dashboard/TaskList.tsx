import type { Task } from "../../types/task";
import "../../css/userTask.css";
function prettyDue(due?: string) {
  if (!due) return "—";
  const d = new Date(String(due).slice(0, 10));
  if (isNaN(d.getTime())) return String(due).slice(0, 10);
  return d.toLocaleDateString();
}

function statusInfo(status: Task["status"]) {
  if (status === "DONE") {
    return { label: "Done", cls: "uiStatusDone" };
  }
  if (status === "IN_PROGRESS") {
    return { label: "In Progress", cls: "uiStatusProgress" };
  }
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
        <div className="uiEmptyText">Try clearing filters or changing your search.</div>
      </div>
    );
  }

  return (
    <div className="taskGrid">
      {tasks.map((t) => {
        const badge = statusInfo(t.status);

        return (
          <button
            key={t.id}
            type="button"
            className="taskCard"
            onClick={() => onOpen(t)}
          >
            <div className="taskCardTop">
              <div className="taskCardTitleWrap">
                <div className="taskTitle">{t.title}</div>
                <span className={`uiBadge ${badge.cls} taskBadge`}>
                  {badge.label}
                </span>
              </div>
            </div>

            <div className="taskDesc">{t.description || "No description added."}</div>

            <div className="taskMeta">
              <div className="taskDue">
                Due: <b>{prettyDue(t.due_date ?? undefined)}</b>
              </div>
              <div className="taskId">#{t.id}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}