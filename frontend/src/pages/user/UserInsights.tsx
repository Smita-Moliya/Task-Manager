import UserCharts from "../../components/dashboard/UserCharts";
import { useUserData } from "./UserContext";

export default function UserInsights() {
  const { tasks, stats } = useUserData();

  return (
    <div className="userPage">
      <div className="userContainer">
        <div className="userStats" style={{ marginBottom: 14 }}>
          <div className="userStatCard"><div className="userStatNum">{stats.total}</div><div className="userStatLabel">Total</div></div>
          <div className="userStatCard"><div className="userStatNum">{stats.pending}</div><div className="userStatLabel">Pending</div></div>
          <div className="userStatCard"><div className="userStatNum">{stats.progress}</div><div className="userStatLabel">In Progress</div></div>
          <div className="userStatCard"><div className="userStatNum">{stats.done}</div><div className="userStatLabel">Done</div></div>
        </div>

        <section className="adminCard">
          <div className="adminCardHead">
            <h3>Your Insights</h3>
            <span className="adminChip">Charts</span>
          </div>
          <div className="adminCardBody">
            <UserCharts tasks={tasks} />
          </div>
        </section>
      </div>
    </div>
  );
}