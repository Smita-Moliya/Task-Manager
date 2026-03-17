import { FiCalendar, FiCheckCircle, FiClock, FiList } from "react-icons/fi";

type TaskRow = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  assigned_to?: number | null;
  due_date?: string | null;
  project_id?: number | null;
  project_name?: string | null;
};

type Props = {
  tasks: TaskRow[];
};

function getStatusClass(status: string) {
  const value = status?.trim().toLowerCase();

  if (value === "completed" || value === "done") {
    return "taskStatusBadge completed";
  }
  if (value === "in progress" || value === "progress") {
    return "taskStatusBadge progress";
  }
  if (value === "pending" || value === "todo") {
    return "taskStatusBadge pending";
  }
  if (value === "cancelled") {
    return "taskStatusBadge cancelled";
  }

  return "taskStatusBadge default";
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function formatDueDate(date?: string | null) {
  if (!date) return "No deadline";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isCompleted(status: string) {
  const value = status?.trim().toLowerCase();
  return value === "completed" || value === "done";
}

function isPending(status: string) {
  const value = status?.trim().toLowerCase();
  return value === "pending" || value === "todo";
}

export default function ProjectTasksCard({ tasks }: Props) {
  const completedCount = tasks.filter((t) => isCompleted(t.status)).length;
  const pendingCount = tasks.filter((t) => isPending(t.status)).length;
  const progressCount = tasks.filter(
    (t) => t.status?.trim().toLowerCase() === "in progress"
  ).length;

  return (
    <div className="uiCard uiCardBody projectTasksCard premiumProjectTasksCard">
      <div className="projectTasksCardHeader">
        <div className="projectTasksHeaderLeft">
          <div className="projectTasksHeaderIcon">
            <FiList />
          </div>

          <div>
            <h4 className="projectTasksTitle">Project Tasks</h4>
            <p className="projectTasksSub">
              Track all tasks linked to this project in one place.
            </p>
          </div>
        </div>

        <div className="projectTasksCount">
          {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="projectTasksStatsRow">
          <div className="projectTasksStatChip total">
            <span className="projectTasksStatIcon">
              <FiList />
            </span>
            <div>
              <div className="projectTasksStatValue">{tasks.length}</div>
              <div className="projectTasksStatLabel">Total</div>
            </div>
          </div>

          <div className="projectTasksStatChip completed">
            <span className="projectTasksStatIcon">
              <FiCheckCircle />
            </span>
            <div>
              <div className="projectTasksStatValue">{completedCount}</div>
              <div className="projectTasksStatLabel">Completed</div>
            </div>
          </div>

          <div className="projectTasksStatChip progress">
            <span className="projectTasksStatIcon">
              <FiClock />
            </span>
            <div>
              <div className="projectTasksStatValue">{progressCount}</div>
              <div className="projectTasksStatLabel">In Progress</div>
            </div>
          </div>

          <div className="projectTasksStatChip pending">
            <span className="projectTasksStatIcon">
              <FiCalendar />
            </span>
            <div>
              <div className="projectTasksStatValue">{pendingCount}</div>
              <div className="projectTasksStatLabel">Pending</div>
            </div>
          </div>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <div className="projectTasksEmpty">
          <div className="projectTasksEmptyIcon">📋</div>
          <div className="projectTasksEmptyTitle">No tasks added yet</div>
          <div className="projectTasksEmptySub">
            Once tasks are created for this project, they will appear here.
          </div>
        </div>
      ) : (
        <div className="projectTasksTableWrap">
          <table className="uiTable projectTasksTable">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="projectTaskMainCell">
                      <div className="projectTaskTitle">{t.title}</div>
                      <div className="projectTaskDesc">
                        {t.description?.trim() || "No description added"}
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={getStatusClass(t.status)}>
                      {getStatusLabel(t.status)}
                    </span>
                  </td>

                  <td>
                    <span className="projectTaskDueDate">
                      {formatDueDate(t.due_date)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}