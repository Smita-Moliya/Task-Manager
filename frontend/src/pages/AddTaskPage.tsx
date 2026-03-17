import { Link } from "react-router-dom";
import CreateTaskForm from "../components/TaskCreateForm";

export default function AddTaskPage() {
  return (
    <div className="addTaskPage">
      <div className="addTaskCard">
        <div className="cardTopRow">
          <div className="titleBlock">
            <h2 className="pageTitle">Create Task</h2>
            <p className="pageSub">
              Select a project, assign the task to a project member, and attach documents.
            </p>
          </div>

          <Link to="/admin/tasks" className="btn ghost">
            ← Back
          </Link>
        </div>

        <div className="cardBody">
          <CreateTaskForm />
        </div>
      </div>
    </div>
  );
}