import { FiArrowRight, FiCalendar, FiClock } from "react-icons/fi";
import { Task } from "../../types/task";
import "../../css/userTask.css"
function dueLabel(due?: string | null) {
  if (!due) return "No due date";

  const taskDate = new Date(due);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startTask = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
  const diff = Math.floor((startTask.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? "s" : ""}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

function getStatusLabel(status: string) {
  if (status === "DONE") return "Done";
  if (status === "IN_PROGRESS") return "In Progress";
  return "Pending";
}

export default function FocusTodayPanel({
  tasks,
  onOpen,
  onViewAll,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onViewAll: () => void;
}) {
  return (
    <section className="uiCard focusPanel">
      <div className="focusPanelHead">
        <div>
          <h3 className="uiCardTitle">Focus Today</h3>
          <p className="uiCardSub">
            Your most important tasks based on deadline and status.
          </p>
        </div>

        <button type="button" className="dashboardLinkBtn" onClick={onViewAll}>
          View All
        </button>
      </div>

      <div className="focusPanelBody">
        {!tasks.length ? (
          <div className="uiEmpty">
            <div className="uiEmptyTitle">No priority tasks</div>
            <div className="uiEmptyText">You’re all caught up for now.</div>
          </div>
        ) : (
          tasks.map((task) => (
            <button
              type="button"
              key={task.id}
              className="focusTaskCard"
              onClick={() => onOpen(task)}
            >
              <div className="focusTaskTop">
                <div className="focusTaskTitleWrap">
                  <div className="focusTaskTitle">{task.title}</div>
                  <div className="focusTaskProject">
                    {task.project_name || "General Task"}
                  </div>
                </div>

                <span
                  className={`uiBadge ${
                    task.status === "DONE"
                      ? "uiStatusDone"
                      : task.status === "IN_PROGRESS"
                      ? "uiStatusProgress"
                      : "uiStatusPending"
                  }`}
                >
                  {getStatusLabel(task.status)}
                </span>
              </div>

              <div className="focusTaskDesc">
                {task.description || "No description added."}
              </div>

              <div className="focusTaskMeta">
                <span className="focusMetaItem">
                  <FiCalendar />
                  {dueLabel(task.due_date)}
                </span>
                <span className="focusMetaItem">
                  <FiClock />
                  #{task.id}
                </span>
                <span className="focusOpenLink">
                  Open <FiArrowRight />
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}