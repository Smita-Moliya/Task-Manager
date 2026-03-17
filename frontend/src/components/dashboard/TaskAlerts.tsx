import { useMemo } from "react";
import { Task } from "../../types/task";
import "../../css/userTask.css";
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function TaskAlerts({ tasks }: { tasks: Task[] }) {
  const { dueToday, overdue, updatedRecently } = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueTodayCount = tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), now) && t.status !== "DONE").length;

    const overdueCount = tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      return d < startToday && t.status !== "DONE";
    }).length;

    // "new/updated" in last 24h based on updated_at (if available)
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const updatedCount = tasks.filter(t => t.updated_at && new Date(t.updated_at).getTime() >= since).length;

    return { dueToday: dueTodayCount, overdue: overdueCount, updatedRecently: updatedCount };
  }, [tasks]);

  if (dueToday === 0 && overdue === 0 && updatedRecently === 0) return null;

  return (
    <div className="alertRow">
      {dueToday > 0 ? <span className="pill">⏰ {dueToday} due today</span> : null}
      {overdue > 0 ? <span className="pill danger">🚨 {overdue} overdue</span> : null}
      {updatedRecently > 0 ? <span className="pill">🆕 {updatedRecently} updated (24h)</span> : null}
    </div>
  );
}
