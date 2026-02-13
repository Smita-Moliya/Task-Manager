import { useAuth } from "../auth/useAuth";
import MyTasks from "../components/MyTasks";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h2 className="heading">User Dashboard</h2>
          <p className="muted">Hi, {user?.name} </p>
        </div>
        <button className="btn" onClick={logout}>Logout</button>
      </div>

      <div className="card">
        <h3 className="cardTitle">Your Tasks</h3>
        <MyTasks />
      </div>
    </div>
  );
}
