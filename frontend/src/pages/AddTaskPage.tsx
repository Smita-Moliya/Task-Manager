import { useNavigate } from "react-router-dom";
import TaskCreateForm from "../components/TaskCreateForm";

export default function AddTaskPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h2 className="heading">Create Task</h2>
          <p className="muted small">Assign tasks to users</p>
        </div>

        <button className="btn" onClick={() => navigate("/admin")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <TaskCreateForm />
      </div>
    </div>
  );
}
