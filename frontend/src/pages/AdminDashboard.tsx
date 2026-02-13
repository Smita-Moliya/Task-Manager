import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import UserList from "../components/UserList";
import TaskList from "../components/TaskList";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h2 className="heading">Admin Dashboard</h2>
          <p className="muted">Welcome, {user?.name} </p>
        </div>

        <div className="topActions">
          <button className="btn primarySmall" onClick={() => navigate("/admin/users/new")}>
            + Add User
          </button>
          <button className="btn primarySmall" onClick={() => navigate("/admin/tasks/new")}>
            + Add Task
          </button>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="grid gridAdmin2">
        <div className="card">
          <UserList />
        </div>

        <div className="card">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
