import { useNavigate } from "react-router-dom";
import { FiArrowDown, FiCheckSquare, FiPlus, FiUsers } from "react-icons/fi";

type Props = {
  projectId: number;
  totalTasks: number;
  memberCount: number;
  onViewTasks?: () => void;
};

export default function ProjectTaskSummaryCard({
  projectId,
  totalTasks,
  memberCount,
  onViewTasks,
}: Props) {
  const navigate = useNavigate();

  const handleAssignTask = () => {
    navigate(`/admin/projects/${projectId}/assign-task`);
  };

  const taskText =
    totalTasks === 0
      ? "No tasks assigned yet."
      : `${totalTasks} task${totalTasks > 1 ? "s are" : " is"} linked to this project.`;

  const memberText =
    memberCount === 0
      ? "Add members first before assigning tasks."
      : `${memberCount} member${memberCount > 1 ? "s" : ""} available for assignment.`;

  return (
    <div className="projectTaskToolbarCard">
      <div className="projectTaskToolbarLeft">
        <div className="projectTaskToolbarIcon">
          <FiCheckSquare />
        </div>

        <div className="projectTaskToolbarContent">
          <div className="projectTaskToolbarTitleRow">
            <h3 className="projectTaskToolbarTitle">Project Tasks</h3>

            <div className="projectTaskToolbarMeta">
              <span className="projectTaskMiniBadge">
                {totalTasks} Task{totalTasks === 1 ? "" : "s"}
              </span>
              <span className="projectTaskMiniBadge subtle">
                <FiUsers />
                {memberCount} Member{memberCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <p className="projectTaskToolbarText">
            {taskText} {memberText}
          </p>
        </div>
      </div>

      <div className="projectTaskToolbarActions">
        <button
          type="button"
          className="projectTaskToolbarGhostBtn"
          onClick={onViewTasks}
          disabled={totalTasks === 0}
        >
          <FiArrowDown />
          View Below
        </button>

        <button
          type="button"
          className="uiButton uiButtonPrimary projectTaskToolbarPrimaryBtn"
          onClick={handleAssignTask}
          disabled={memberCount === 0}
        >
          <FiPlus />
          Assign Task
        </button>
      </div>
    </div>
  );
}