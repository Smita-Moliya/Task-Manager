import { useEffect, useMemo, useState } from "react";
import { getProjectAnalytics } from "../../api/analytics";
import "../../css/projectAnalytics.css"
import {
  ProjectAnalyticsRow,
  ProjectAnalyticsSummary,
} from "../../types/project";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FiRefreshCw,
  FiFolder,
  FiCheckCircle,
  FiPauseCircle,
  FiUsers,
  FiTrendingUp,
  FiSearch,
  FiActivity,
} from "react-icons/fi";

type SortKey =
  | "project_name"
  | "member_count"
  | "task_count"
  | "completed_count"
  | "pending_count"
  | "progress_percent";

export default function ProjectAnalyticsPanel() {
  const [summary, setSummary] = useState<ProjectAnalyticsSummary | null>(null);
  const [items, setItems] = useState<ProjectAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("progress_percent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((item) =>
      item.project_name.toLowerCase().includes(q)
    );

    return [...filtered].sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;

      if (sortBy === "project_name") {
        return a.project_name.localeCompare(b.project_name) * direction;
      }

      return ((a[sortBy] as number) - (b[sortBy] as number)) * direction;
    });
  }, [items, search, sortBy, sortOrder]);

  const topProjects = useMemo(() => {
    return [...items]
      .sort((a, b) => b.progress_percent - a.progress_percent)
      .slice(0, 6)
      .map((item) => ({
        name:
          item.project_name.length > 14
            ? item.project_name.slice(0, 14) + "..."
            : item.project_name,
        progress: item.progress_percent,
        tasks: item.task_count,
        completed: item.completed_count,
      }));
  }, [items]);

  const workloadData = useMemo(() => {
    return [...items]
      .sort((a, b) => b.task_count - a.task_count)
      .slice(0, 6)
      .map((item) => ({
        name:
          item.project_name.length > 14
            ? item.project_name.slice(0, 14) + "..."
            : item.project_name,
        total: item.task_count,
        pending: item.pending_count,
        completed: item.completed_count,
      }));
  }, [items]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.members += item.member_count;
        acc.tasks += item.task_count;
        acc.completed += item.completed_count;
        acc.pending += item.pending_count;
        return acc;
      },
      { members: 0, tasks: 0, completed: 0, pending: 0 }
    );
  }, [items]);

  const completionRate =
    totals.tasks > 0 ? Math.round((totals.completed / totals.tasks) * 100) : 0;

  const chartStatusData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Active", value: summary.active_projects },
      { name: "Completed", value: summary.completed_projects },
      { name: "On Hold", value: summary.on_hold_projects },
    ];
  }, [summary]);

  function getProgressTone(progress: number) {
    if (progress >= 80) return "excellent";
    if (progress >= 50) return "good";
    if (progress >= 25) return "warning";
    return "danger";
  }

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortOrder(key === "project_name" ? "asc" : "desc");
  }

  return (
    <div className="eliteAnalyticsPage">
      {/* <div className="eliteHero"> */}
        {/* <div className="eliteHeroContent">
          <div className="eliteEyebrow">
            <FiActivity />
            <span>Admin Analytics</span>
          </div>

          <h1 className="eliteHeroTitle">Project Analytics Dashboard</h1>

          <p className="eliteHeroSubtitle">
            Track project health, workload distribution, completion rate, and
            team contribution with a modern premium dashboard.
          </p>
        </div> */}

        {/* <button
          type="button"
          className="eliteRefreshBtn"
          onClick={load}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? "spinIcon" : ""} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button> */}
      {/* </div> */}

      {msg ? (
        <div className="eliteAlert">
          <div>
            <strong>Analytics could not be loaded.</strong>
            <div>{msg}</div>
          </div>
          <button type="button" className="eliteMiniBtn" onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="eliteLoadingGrid">
          <div className="eliteSkeleton eliteSkeletonCard" />
          <div className="eliteSkeleton eliteSkeletonCard" />
          <div className="eliteSkeleton eliteSkeletonCard" />
          <div className="eliteSkeleton eliteSkeletonCard" />
          <div className="eliteSkeleton eliteSkeletonLarge" />
          <div className="eliteSkeleton eliteSkeletonLarge" />
          <div className="eliteSkeleton eliteSkeletonTable" />
        </div>
      ) : (
        <>
          {summary ? (
            <div className="eliteStatsGrid">
              <div className="eliteStatCard gradientBlue">
                <div className="eliteStatIcon">
                  <FiFolder />
                </div>
                <div>
                  <div className="eliteStatLabel">Total Projects</div>
                  <div className="eliteStatValue">{summary.total_projects}</div>
                  <div className="eliteStatMeta">All registered projects</div>
                </div>
              </div>

              <div className="eliteStatCard gradientPurple">
                <div className="eliteStatIcon">
                  <FiUsers />
                </div>
                <div>
                  <div className="eliteStatLabel">Team Members</div>
                  <div className="eliteStatValue">{totals.members}</div>
                  <div className="eliteStatMeta">Across all projects</div>
                </div>
              </div>

              <div className="eliteStatCard gradientGreen">
                <div className="eliteStatIcon">
                  <FiCheckCircle />
                </div>
                <div>
                  <div className="eliteStatLabel">Completion Rate</div>
                  <div className="eliteStatValue">{completionRate}%</div>
                  <div className="eliteStatMeta">Based on completed tasks</div>
                </div>
              </div>

              <div className="eliteStatCard gradientAmber">
                <div className="eliteStatIcon">
                  <FiPauseCircle />
                </div>
                <div>
                  <div className="eliteStatLabel">On Hold</div>
                  <div className="eliteStatValue">{summary.on_hold_projects}</div>
                  <div className="eliteStatMeta">Projects currently paused</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="eliteChartsGrid">
            <div className="elitePanel">
              <div className="elitePanelHeader">
                <div>
                  <h3>Top Project Progress</h3>
                  <p>Projects with the highest completion percentage</p>
                </div>
              </div>

              <div className="eliteChartBox">
                {topProjects.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topProjects}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="progress" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="eliteEmptyBox">No progress data available.</div>
                )}
              </div>
            </div>

            <div className="elitePanel">
              <div className="elitePanelHeader">
                <div>
                  <h3>Project Status Split</h3>
                  <p>Distribution of project states</p>
                </div>
              </div>

              <div className="eliteChartBox">
                {chartStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={chartStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        dataKey="value"
                        paddingAngle={4}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#22c55e" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="eliteEmptyBox">No status data available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="eliteChartsGrid">
            <div className="elitePanel">
              <div className="elitePanelHeader">
                <div>
                  <h3>Task Workload Overview</h3>
                  <p>Projects with the largest task volumes</p>
                </div>
              </div>

              <div className="eliteChartBox">
                {workloadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={workloadData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="eliteEmptyBox">No workload data available.</div>
                )}
              </div>
            </div>

            <div className="elitePanel">
              <div className="elitePanelHeader">
                <div>
                  <h3>Quick Summary</h3>
                  <p>Compact snapshot of current analytics</p>
                </div>
              </div>

              <div className="eliteSummaryList">
                <div className="eliteSummaryItem">
                  <span>Total Tasks</span>
                  <strong>{totals.tasks}</strong>
                </div>
                <div className="eliteSummaryItem">
                  <span>Completed Tasks</span>
                  <strong>{totals.completed}</strong>
                </div>
                <div className="eliteSummaryItem">
                  <span>Pending Tasks</span>
                  <strong>{totals.pending}</strong>
                </div>
                <div className="eliteSummaryItem">
                  <span>Active Projects</span>
                  <strong>{summary?.active_projects ?? 0}</strong>
                </div>
                <div className="eliteSummaryItem">
                  <span>Completed Projects</span>
                  <strong>{summary?.completed_projects ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="elitePanel">
            <div className="elitePanelHeader elitePanelHeaderResponsive">
              <div>
                <h3>Project Details</h3>
                <p>Search and sort project analytics records</p>
              </div>

              <div className="eliteToolbar">
                <div className="eliteSearchBox">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search project..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="eliteSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                >
                  <option value="progress_percent">Sort by Progress</option>
                  <option value="project_name">Sort by Name</option>
                  <option value="member_count">Sort by Members</option>
                  <option value="task_count">Sort by Tasks</option>
                  <option value="completed_count">Sort by Completed</option>
                  <option value="pending_count">Sort by Pending</option>
                </select>

                <select
                  className="eliteSelect"
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "asc" | "desc")
                  }
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="eliteEmptyBox">No projects found.</div>
            ) : (
              <div className="eliteTableWrap">
                <table className="eliteTable">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("project_name")}>Project</th>
                      <th onClick={() => handleSort("member_count")}>Members</th>
                      <th onClick={() => handleSort("task_count")}>Tasks</th>
                      <th onClick={() => handleSort("completed_count")}>Completed</th>
                      <th onClick={() => handleSort("pending_count")}>Pending</th>
                      <th onClick={() => handleSort("progress_percent")}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((p) => {
                      const tone = getProgressTone(p.progress_percent);

                      return (
                        <tr key={p.project_id}>
                          <td>
                            <div className="eliteProjectCell">
                              <div className="eliteProjectName">{p.project_name}</div>
                              <div className="eliteProjectMeta">
                                Project ID: {p.project_id}
                              </div>
                            </div>
                          </td>
                          <td>{p.member_count}</td>
                          <td>{p.task_count}</td>
                          <td>
                            <span className="eliteBadge success">
                              {p.completed_count}
                            </span>
                          </td>
                          <td>
                            <span className="eliteBadge warning">
                              {p.pending_count}
                            </span>
                          </td>
                          <td style={{ minWidth: 220 }}>
                            <div className="eliteProgressTop">
                              <span className={`eliteProgressText ${tone}`}>
                                {p.progress_percent}%
                              </span>
                            </div>
                            <div className="eliteProgressBar">
                              <div
                                className={`eliteProgressFill ${tone}`}
                                style={{ width: `${p.progress_percent}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}