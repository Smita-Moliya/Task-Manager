export default function DueSummaryCard({
  dueToday,
  overdue,
  inProgress,
  completed,
}: {
  dueToday: number;
  overdue: number;
  inProgress: number;
  completed: number;
}) {
  return (
    <section className="uiCard sideInfoCard">
      <div className="sideInfoHead">
        <h3 className="uiCardTitle">Due Summary</h3>
        <p className="uiCardSub">A quick look at your workload.</p>
      </div>

      <div className="summaryList">
        <div className="summaryRow">
          <span>Due today</span>
          <strong>{dueToday}</strong>
        </div>
        <div className="summaryRow danger">
          <span>Overdue</span>
          <strong>{overdue}</strong>
        </div>
        <div className="summaryRow info">
          <span>In progress</span>
          <strong>{inProgress}</strong>
        </div>
        <div className="summaryRow success">
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
      </div>
    </section>
  );
}