import { useMemo, useState, useRef, useEffect } from "react";
import {
  FiActivity,
  FiCalendar,
  FiClock,
  FiMessageSquare,
  FiPaperclip,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import ThemeToggle from "../../components/ThemeToggle";
import { api } from "../../api/api";
import UserPageHeader from "./UserPageHeader";
import { useUserData } from "./UserContext";
import "../../css/userActivity.css";

function getEventMeta(action?: string) {
  const value = (action || "").toUpperCase();

  if (value.includes("COMMENT")) {
    return {
      label: "Comment",
      className: "comment",
      icon: <FiMessageSquare />,
    };
  }

  if (value.includes("ATTACH")) {
    return {
      label: "Attachment",
      className: "attachment",
      icon: <FiPaperclip />,
    };
  }

  if (value.includes("STATUS")) {
    return {
      label: "Status",
      className: "status",
      icon: <FiRefreshCw />,
    };
  }

  return {
    label: action || "Update",
    className: "default",
    icon: <FiActivity />,
  };
}

function formatRelativeTime(value?: string) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function formatFullDate(value?: string) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function UserActivity() {
  const {
    activities,
    activityPage,
    setActivityPage,
    activityTotalPages,
    activityTotal,
  } = useUserData();

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function downloadLogs(format: "pdf" | "excel") {
    try {
      if (format === "pdf") setExportingPdf(true);
      else setExportingExcel(true);

      const res = await api.get("/my/activity/export/", {
        params: { format },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "pdf" ? "my_activities.pdf" : "my_activities.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error("Export failed", e);
    } finally {
      if (format === "pdf") setExportingPdf(false);
      else setExportingExcel(false);
    }
  }

  const stats = useMemo(() => {
    let comments = 0;
    let attachments = 0;
    let statusChanges = 0;
    let taskCreated = 0;

    for (const item of activities) {
      const a = (item.action || "").toUpperCase();

      if (a.includes("COMMENT")) comments += 1;
      else if (a.includes("ATTACH")) attachments += 1;
      else if (a.includes("STATUS")) statusChanges += 1;
      else if (a.includes("CREATE")) taskCreated += 1;
    }

    return {
      total: activityTotal || activities.length,
      comments,
      attachments,
      statusChanges,
      taskCreated,
    };
  }, [activities, activityTotal]);

  return (
    <div className="userActivityPage">
      <UserPageHeader
        eyebrow="WORK HISTORY"
        title="Recent Activity"
        subtitle="Track comments, uploads, updates, and task changes in one place."
        rightSlot={<ThemeToggle />}
      />

      <section className="activitySummaryCard">
        <div className="activitySummaryGrid">
          <div className="activitySummaryItem neutral">
            <span>Total Events</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="activitySummaryItem created">
            <span>Task Created</span>
            <strong>{stats.taskCreated}</strong>
          </div>

          <div className="activitySummaryItem status">
            <span>Status Changes</span>
            <strong>{stats.statusChanges}</strong>
          </div>

          <div className="activitySummaryItem comment">
            <span>Comments</span>
            <strong>{stats.comments}</strong>
          </div>

          <div className="activitySummaryItem attachment">
            <span>Attachments</span>
            <strong>{stats.attachments}</strong>
          </div>
        </div>
      </section>

      <section className="activityTableCard">
        <div className="activityTableHeader">
          <div>
            <h3 className="activityTableTitle">Activity Timeline</h3>
            <p className="activityTableSubtext">
              Latest actions across your tasks, comments, uploads, and status
              updates.
            </p>
          </div>

          <div className="activityTableHeaderMeta" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span className="activityHeaderChip">
              <FiClock />
              Page {activityPage} of {activityTotalPages}
            </span>
            <div ref={exportMenuRef} style={{ position: "relative" }}>
              <button
                className="activityPageBtn"
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={exportingPdf || exportingExcel}
              >
                {exportingPdf || exportingExcel ? "Downloading..." : "Download"}
              </button>

              {showExportMenu && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  background: "var(--bg-card, #fff)",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  borderRadius: 6,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  zIndex: 50,
                  minWidth: 140,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}>
                  <button
                    className="activityPageBtn"
                    style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid var(--border-color, #e2e8f0)", background: "transparent", padding: "8px 16px", cursor: "pointer" }}
                    onClick={() => { setShowExportMenu(false); downloadLogs("pdf"); }}
                  >
                    As PDF
                  </button>
                  <button
                    className="activityPageBtn"
                    style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, border: "none", background: "transparent", padding: "8px 16px", cursor: "pointer" }}
                    onClick={() => { setShowExportMenu(false); downloadLogs("excel"); }}
                  >
                    As Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
              {!activities.length ? (
                <tr>
                  <td colSpan={4}>
                    <div className="activityEmpty">No recent activity found.</div>
                  </td>
                </tr>
              ) : (
                activities.map((item, index) => {
                  const eventMeta = getEventMeta(item.action);

                  return (
                    <tr key={item.id ?? index}>
                      <td>
                        <div className="activityTaskCell">
                          <div className="activityTaskTitle">
                            {item.task_title || "Untitled Task"}
                          </div>
                          <div className="activityTaskId">
                            #{item.task_id || "—"}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`activityEventBadge ${eventMeta.className}`}>
                          <span className="activityEventIcon">{eventMeta.icon}</span>
                          {eventMeta.label}
                        </span>
                      </td>

                      <td>
                        <div className="activityDetailsCell">
                          {item.message || "No additional details"}
                        </div>
                      </td>

                      <td>
                        <div className="activityTimeCell">
                          <span className="activityTimeRelative">
                            {formatRelativeTime(item.created_at)}
                          </span>
                          <span className="activityTimeFull">
                            <FiCalendar />
                            {formatFullDate(item.created_at)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="activityPagination">
          <button
            type="button"
            className="activityPageBtn"
            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
            disabled={activityPage <= 1}
          >
            <FiChevronLeft />
            Previous
          </button>

          <div className="activityPageInfo">
            Page <strong>{activityPage}</strong> of{" "}
            <strong>{activityTotalPages}</strong>
          </div>

          <button
            type="button"
            className="activityPageBtn"
            onClick={() =>
              setActivityPage((p) => Math.min(activityTotalPages, p + 1))
            }
            disabled={activityPage >= activityTotalPages}
          >
            Next
            <FiChevronRight />
          </button>
        </div>
      </section>
    </div>
  );
}