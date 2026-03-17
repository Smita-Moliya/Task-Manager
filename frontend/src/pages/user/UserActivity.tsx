import ActivityTimeline from "../../components/dashboard/ActivityTimeline";
import { useUserData } from "./UserContext";

export default function UserActivity() {
  const { activities } = useUserData();

  return (
    <section className="adminCard">
      <div className="adminCardHead">
        <h3>Activity</h3>
        <span className="adminChip">Timeline</span>
      </div>
      <div className="adminCardBody">
        <ActivityTimeline activities={activities} />
      </div>
    </section>
  );
}