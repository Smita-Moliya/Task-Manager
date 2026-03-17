import { useNavigate } from "react-router-dom";
import {
  FiCheckSquare,
  FiClock,
  FiLoader,
  FiPlus,
  FiUsers,
} from "react-icons/fi";

type TaskRow = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  assigned_to_name?: string | null;
};

type Props = {
  projectId: number;
  totalTasks: number;
  memberCount: number;
  tasks: TaskRow[];
};

function getStatusClass(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "DONE" || s === "COMPLETED") return "completed";
  if (s === "IN_PROGRESS") return "progress";
  if (s === "PENDING") return "pending";
  if (s === "CANCELLED") return "cancelled";
  return "default";
}

function getStatusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "DONE") return "Done";
  if (s === "COMPLETED") return "Completed";
  if (s === "PENDING") return "Pending";
  if (s === "CANCELLED") return "Cancelled";
  return status || "Unknown";
}

export default function ProjectTasksSection({
  projectId,
  totalTasks,
  memberCount,
  tasks,
}: Props) {
  const navigate = useNavigate();

  const completed = tasks.filter((t) => {
    const s = (t.status || "").toUpperCase();
    return s === "DONE" || s === "COMPLETED";
  }).length;

  const inProgress = tasks.filter(
    (t) => (t.status || "").toUpperCase() === "IN_PROGRESS"
  ).length;

  const pending = tasks.filter(
    (t) => (t.status || "").toUpperCase() === "PENDING"
  ).length;

  return (
    <div className="projectTasksUnifiedCard">
      <div className="projectTasksUnifiedTop">
        <div className="projectTasksUnifiedTitleWrap">
          {/* <div className="projectTasksUnifiedIcon">
            <FiCheckSquare />
          </div> */}

          {/* <div>
            <h3 className="projectTasksUnifiedTitle">Project Tasks</h3>
            <p className="projectTasksUnifiedSub">
              Review all tasks linked to this project.
            </p>
          </div> */}
        </div>

        <div className="projectTasksUnifiedActions">
          <span className="projectTasksUnifiedBadge">{totalTasks} Tasks</span>
          <span className="projectTasksUnifiedBadge subtle">
            <FiUsers />
            {memberCount} Members
          </span>

          <button
            type="button"
            className="projectTasksUnifiedAssignBtn"
            onClick={() => navigate(`/admin/projects/${projectId}/assign-task`)}
            disabled={memberCount === 0}
          >
            <FiPlus />
            Assign Task
          </button>
        </div>
      </div>

      <div className="projectTasksUnifiedStats">
        <div className="projectTasksUnifiedStat total">
          <div className="projectTasksUnifiedStatIcon">
            <FiCheckSquare />
          </div>
          <div>
            <div className="projectTasksUnifiedStatValue">{totalTasks}</div>
            <div className="projectTasksUnifiedStatLabel">Total</div>
          </div>
        </div>

        <div className="projectTasksUnifiedStat completed">
          <div className="projectTasksUnifiedStatIcon">
            <FiCheckSquare />
          </div>
          <div>
            <div className="projectTasksUnifiedStatValue">{completed}</div>
            <div className="projectTasksUnifiedStatLabel">Completed</div>
          </div>
        </div>

        <div className="projectTasksUnifiedStat progress">
          <div className="projectTasksUnifiedStatIcon">
            <FiLoader />
          </div>
          <div>
            <div className="projectTasksUnifiedStatValue">{inProgress}</div>
            <div className="projectTasksUnifiedStatLabel">In Progress</div>
          </div>
        </div>

        <div className="projectTasksUnifiedStat pending">
          <div className="projectTasksUnifiedStatIcon">
            <FiClock />
          </div>
          <div>
            <div className="projectTasksUnifiedStatValue">{pending}</div>
            <div className="projectTasksUnifiedStatLabel">Pending</div>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="projectTasksUnifiedEmpty">
          <div className="projectTasksUnifiedEmptyTitle">No tasks found</div>
          <div className="projectTasksUnifiedEmptySub">
            This project does not have any assigned tasks yet.
          </div>
        </div>
      ) : (
        <div className="projectTasksUnifiedTableWrap">
          <table className="projectTasksUnifiedTable">
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
                    <div className="projectTasksUnifiedMainCell">
                      <div className="projectTasksUnifiedTaskTitle">{task.title}</div>
                      {task.description ? (
                        <div className="projectTasksUnifiedTaskDesc">
                          {task.description}
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`taskStatusBadge ${getStatusClass(task.status)}`}
                    >
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