import { FiCheckSquare, FiClock, FiLoader, FiXCircle } from "react-icons/fi";

type TaskRow = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  assigned_to_name?: string | null;
};

type Props = {
  tasks: TaskRow[];
};

function getStatusClass(status: string) {
  const s = status?.toUpperCase();

  if (s === "DONE" || s === "COMPLETED") return "completed";
  if (s === "IN_PROGRESS") return "progress";
  if (s === "PENDING") return "pending";
  if (s === "CANCELLED") return "cancelled";
  return "default";
}

function getStatusLabel(status: string) {
  const s = status?.toUpperCase();

  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "DONE") return "Done";
  if (s === "COMPLETED") return "Completed";
  if (s === "PENDING") return "Pending";
  if (s === "CANCELLED") return "Cancelled";
  return status || "Unknown";
}

export default function ProjectTasksTable({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter(
    (t) => t.status?.toUpperCase() === "DONE" || t.status?.toUpperCase() === "COMPLETED"
  ).length;
  const inProgress = tasks.filter(
    (t) => t.status?.toUpperCase() === "IN_PROGRESS"
  ).length;
  const pending = tasks.filter(
    (t) => t.status?.toUpperCase() === "PENDING"
  ).length;

  return (
    <div className="premiumProjectTasksCard uiCardBody">
      <div className="projectTasksCardHeader">
        <div className="projectTasksHeaderLeft">
          <div className="projectTasksHeaderIcon">
            <FiCheckSquare />
          </div>

          <div>
            <h3 className="projectTasksTitle">Project Tasks</h3>
            <p className="projectTasksSub">
              All tasks assigned to this project are shown here.
            </p>
          </div>
        </div>

        <div className="projectTasksCount">
          {total} Task{total === 1 ? "" : "s"}
        </div>
      </div>

      <div className="projectTasksStatsRow">
        <div className="projectTasksStatChip total">
          <div className="projectTasksStatIcon">
            <FiCheckSquare />
          </div>
          <div>
            <div className="projectTasksStatValue">{total}</div>
            <div className="projectTasksStatLabel">Total</div>
          </div>
        </div>

        <div className="projectTasksStatChip completed">
          <div className="projectTasksStatIcon">
            <FiCheckSquare />
          </div>
          <div>
            <div className="projectTasksStatValue">{completed}</div>
            <div className="projectTasksStatLabel">Completed</div>
          </div>
        </div>

        <div className="projectTasksStatChip progress">
          <div className="projectTasksStatIcon">
            <FiLoader />
          </div>
          <div>
            <div className="projectTasksStatValue">{inProgress}</div>
            <div className="projectTasksStatLabel">In Progress</div>
          </div>
        </div>

        <div className="projectTasksStatChip pending">
          <div className="projectTasksStatIcon">
            <FiClock />
          </div>
          <div>
            <div className="projectTasksStatValue">{pending}</div>
            <div className="projectTasksStatLabel">Pending</div>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="projectTasksEmpty">
          <div className="projectTasksEmptyIcon">
            <FiXCircle />
          </div>
          <div className="projectTasksEmptyTitle">No tasks found</div>
          <div className="projectTasksEmptySub">
            This project does not have any assigned tasks yet.
          </div>
        </div>
      ) : (
        <div className="projectTasksTableWrap">
          <table className="projectTasksTable">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div className="projectTaskMainCell">
                      <div className="projectTaskTitle">{task.title}</div>
                      {task.description ? (
                        <div className="projectTaskDesc">{task.description}</div>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    <span className={`taskStatusBadge ${getStatusClass(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </td>

                  <td>{task.assigned_to_name || "-"}</td>

                  <td>
                    <span className="projectTaskDueDate">
                      {task.due_date || "No due date"}
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