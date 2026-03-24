type ActivityItem = {
  id: number;
  task_id: number;
  task_title: string;
  action: string;
  message: string;
  created_at: string;
};

function formatWhen(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString();
}

export default function ActivityPreviewCard({
  activities,
  onViewAll,
}: {
  activities: ActivityItem[];
  onViewAll: () => void;
}) {
  return (
    <section className="uiCard dashboardPreviewCard">
      <div className="uiCardHeader dashboardPreviewHead">
        <div>
          <h3 className="uiCardTitle">Recent Activity</h3>
          <p className="uiCardSub">A quick preview of the latest updates.</p>
        </div>

        <button type="button" className="dashboardLinkBtn" onClick={onViewAll}>
          View All
        </button>
      </div>

      <div className="uiCardBody dashboardPreviewBody">
        {!activities.length ? (
          <div className="uiEmpty">
            <div className="uiEmptyTitle">No recent activity</div>
            <div className="uiEmptyText">Updates will appear here.</div>
          </div>
        ) : (
          <div className="activityPreviewList">
            {activities.map((item) => (
              <div key={item.id} className="activityPreviewItem">
                <div className="activityPreviewTitle">
                  {item.task_title || "Task update"}
                </div>
                <div className="activityPreviewText">
                  {item.message || item.action}
                </div>
                <div className="activityPreviewMeta">{formatWhen(item.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}