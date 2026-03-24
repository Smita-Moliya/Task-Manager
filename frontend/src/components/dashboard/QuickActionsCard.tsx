import { FiRefreshCw, FiCheckSquare, FiActivity, FiPaperclip } from "react-icons/fi";

export default function QuickActionsCard({
  onRefresh,
  onOpenTasks,
  onOpenActivity,
  onOpenAttachments,
}: {
  onRefresh: () => Promise<void>;
  onOpenTasks: () => void;
  onOpenActivity: () => void;
  onOpenAttachments: () => void;
}) {
  return (
    <section className="uiCard sideInfoCard">
      <div className="sideInfoHead">
        <h3 className="uiCardTitle">Quick Actions</h3>
        <p className="uiCardSub">Jump quickly to important sections.</p>
      </div>

      <div className="quickActionsList">
        <button type="button" className="quickActionBtn" onClick={onRefresh}>
          <FiRefreshCw />
          Refresh Dashboard
        </button>

        <button type="button" className="quickActionBtn" onClick={onOpenTasks}>
          <FiCheckSquare />
          Open My Tasks
        </button>

        <button type="button" className="quickActionBtn" onClick={onOpenActivity}>
          <FiActivity />
          Open Activity
        </button>

        <button type="button" className="quickActionBtn" onClick={onOpenAttachments}>
          <FiPaperclip />
          Open Attachments
        </button>
      </div>
    </section>
  );
}