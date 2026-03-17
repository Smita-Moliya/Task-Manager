import { useEffect, useState } from "react";
import { getProjectAnalytics } from "../../api/analytics";
import {
  ProjectAnalyticsRow,
  ProjectAnalyticsSummary,
} from "../../types/project";

export default function ProjectAnalyticsPanel() {
  const [summary, setSummary] = useState<ProjectAnalyticsSummary | null>(null);
  const [items, setItems] = useState<ProjectAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");

    try {
      const res = await getProjectAnalytics();
      setSummary(res.data?.summary || null);
      setItems(Array.isArray(res.data?.by_project) ? res.data.by_project : []);
    } catch (err: any) {
      setSummary(null);
      setItems([]);
      setMsg(err?.response?.data?.message || "Failed to load project analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="uiCard uiCardBody">
      <div className="pageHeader" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Project Analytics</h3>
          <p style={{ margin: "4px 0 0" }}>
            Overview of project workload and completion progress.
          </p>
        </div>
      </div>

      {msg ? <div className="uiAlert uiAlertInfo">{msg}</div> : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {summary ? (
            <div className="summaryGrid" style={{ marginBottom: 16 }}>
              <div className="summaryCard">
                <div className="summaryLabel">Total Projects</div>
                <div className="summaryValue">{summary.total_projects}</div>
              </div>
              <div className="summaryCard">
                <div className="summaryLabel">Active</div>
                <div className="summaryValue">{summary.active_projects}</div>
              </div>
              <div className="summaryCard">
                <div className="summaryLabel">Completed</div>
                <div className="summaryValue">{summary.completed_projects}</div>
              </div>
              <div className="summaryCard">
                <div className="summaryLabel">On Hold</div>
                <div className="summaryValue">{summary.on_hold_projects}</div>
              </div>
            </div>
          ) : null}

          <div className="tableWrap">
            <table className="uiTable">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Members</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.project_id}>
                    <td>{p.project_name}</td>
                    <td>{p.member_count}</td>
                    <td>{p.task_count}</td>
                    <td>{p.completed_count}</td>
                    <td>{p.pending_count}</td>
                    <td style={{ minWidth: 180 }}>
                      <div className="projectProgressHead">
                        <span>{p.progress_percent}%</span>
                      </div>
                      <div className="projectProgressBar">
                        <div
                          className="projectProgressFill"
                          style={{ width: `${p.progress_percent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}