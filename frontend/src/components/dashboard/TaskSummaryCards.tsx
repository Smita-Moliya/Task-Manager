import { useMemo } from "react";
import type { Task } from "../../types/task";

export default function TaskSummaryCards({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const progress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, pending, progress, done, pct };
  }, [tasks]);

  return (
    <div className="uStatGrid">
      <div className="uStat">
        <div className="uStatTop">
          <div className="uStatLabel">Total</div>
          <span className="uPill">All</span>
        </div>
        <div className="uStatNum">{stats.total}</div>
      </div>

      <div className="uStat">
        <div className="uStatTop">
          <div className="uStatLabel">Pending</div>
          <span className="uPill warn">Pending</span>
        </div>
        <div className="uStatNum">{stats.pending}</div>
      </div>

      <div className="uStat">
        <div className="uStatTop">
          <div className="uStatLabel">In Progress</div>
          <span className="uPill info">Working</span>
        </div>
        <div className="uStatNum">{stats.progress}</div>
      </div>

      <div className="uStat">
        <div className="uStatTop">
          <div className="uStatLabel">Done</div>
          <span className="uPill ok">Completed</span>
        </div>
        <div className="uStatNum">{stats.done}</div>
        <div className="uStatHint">{stats.pct}% completed</div>
      </div>
    </div>
  );
}
