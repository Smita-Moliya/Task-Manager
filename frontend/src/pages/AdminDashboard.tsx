import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import UserList from "../components/UserList";
import TaskList from "../components/TaskList";
import AdminCharts from "../components/AdminCharts";
import "../styles.css";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="adminPage">
      <div className="adminContainer">
        {/* Top bar */}
        <div className="adminTopbar">
          <div className="adminTitleBlock">
            <h2 className="adminHeading">Admin Dashboard</h2>
            <p className="adminMuted">Welcome, <b>{user?.name || "Admin"}</b></p>
          </div>

          <div className="adminTopActions">
            <button className="adminBtn adminBtnPrimary" onClick={() => navigate("/admin/users/new")}>
              + Add User
            </button>
            <button className="adminBtn adminBtnPrimary" onClick={() => navigate("/admin/tasks/new")}>
              + Add Task
            </button>
            <button className="adminBtn adminBtnGhost" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="adminGrid">
          <section className="adminCard">
            <div className="adminCardHead">
              <h3>Users</h3>
              <span className="adminChip">Manage</span>
            </div>
            <div className="adminCardBody">
              <UserList />
            </div>
          </section>

          <section className="adminCard">
            <div className="adminCardHead">
              <h3>Tasks</h3>
              <span className="adminChip">Track</span>
            </div>
            <div className="adminCardBody">
              <TaskList />
            </div>
          </section>

          <section className="adminCard adminCardWide">
            <div className="adminCardHead">
              <h3>Analytics</h3>
              <span className="adminChip">Insights</span>
            </div>
            <div className="adminCardBody">
              <AdminCharts />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
