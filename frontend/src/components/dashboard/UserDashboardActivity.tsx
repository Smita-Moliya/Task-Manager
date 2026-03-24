import ActivityTimeline from "./ActivityTimeline";

type ActivityItem = {
  id: number;
  task_id: number;
  task_title: string;
  action: string;
  message: string;
  created_at: string;
};

export default function UserDashboardActivity({
  activities,
}: {
  activities: ActivityItem[];
}) {
  return (
    <section className="uiCard dashboardActivityCard">
      <div className="uiCardHeader userTasksHeader">
        <div className="uiCardHeaderLeft">
          <h3 className="uiCardTitle">Recent Activity</h3>
          <p className="uiCardSub">
            Recent updates on your tasks, comments, and attachments.
          </p>
        </div>
        <span className="uiBadge uiBadgePrimary">Timeline</span>
      </div>

      <div className="uiCardBody">
        <ActivityTimeline activities={activities} />
      </div>
    </section>
  );
}