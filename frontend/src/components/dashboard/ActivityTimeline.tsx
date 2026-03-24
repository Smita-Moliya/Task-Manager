import { useMemo } from "react";
import "../../css/userActivity.css";
type ActivityItem = {
  id: number;
  task_id: number;
  task_title: string;
  action: string;
  message: string;
  created_at: string;
};

function timeAgo(iso?: string) {
  if (!iso) return "—";

  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";

  const diff = Date.now() - t;
  if (diff < 0) return "just now";

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;

  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getActivityLabel(action: string) {
  switch (action) {
    case "TASK_ASSIGNED":
      return "Assigned";
    case "TASK_UPDATED":
      return "Updated";
    case "STATUS_CHANGED":
      return "Status";
    case "ATTACHMENT_UPLOADED":
      return "Attachment";
    case "COMMENT_ADDED":
      return "Comment";
    case "TASK_REASSIGNED":
      return "Reassigned";
    case "DUE_DATE_CHANGED":
      return "Due Date";
    case "TASK_DELETED":
      return "Deleted";
    default:
      return action.replaceAll("_", " ");
  }
}

function getActivityClass(action: string) {
  switch (action) {
    case "TASK_ASSIGNED":
      return "assigned";
    case "TASK_UPDATED":
      return "updated";
    case "STATUS_CHANGED":
      return "status";
    case "ATTACHMENT_UPLOADED":
      return "attachment";
    case "COMMENT_ADDED":
      return "comment";
    case "TASK_REASSIGNED":
      return "reassigned";
    case "DUE_DATE_CHANGED":
      return "duedate";
    case "TASK_DELETED":
      return "danger";
    default:
      return "default";
  }
}

function safeTime(value?: string) {
  const time = new Date(value || "").getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function ActivityTimeline({
  activities = [],
}: {
  activities?: ActivityItem[];
}) {
  const items = useMemo(() => {
    const safeActivities = Array.isArray(activities) ? activities : [];
    return safeActivities
      .slice()
      .sort((a, b) => safeTime(b.created_at) - safeTime(a.created_at));
  }, [activities]);

  if (!items.length) {
    return (
      <div className="activityEmpty">
        <div className="activityEmptyTitle">No recent notifications</div>
        <div className="activityEmptyText">
          Updates about tasks, comments, attachments, and changes will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="activityTableWrap">
      <table className="activityTable">
        <thead>
          <tr>
            <th>Task</th>
            <th>Event</th>
            <th>Details</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => {
            const cls = getActivityClass(a.action);
            return (
              <tr key={a.id}>
                <td>
                  <div className="activityTaskCell">
                    <div className="activityTaskName">{a.task_title}</div>
                    <div className="activityTaskId">#{a.task_id}</div>
                  </div>
                </td>
                <td>
                  <span className={`activityEventTag ${cls}`}>
                    {getActivityLabel(a.action)}
                  </span>
                </td>
                <td>
                  <div className="activityDetailText">{a.message}</div>
                </td>
                <td>
                  <span
                    className="activityTimeText"
                    title={a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                  >
                    {timeAgo(a.created_at)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}