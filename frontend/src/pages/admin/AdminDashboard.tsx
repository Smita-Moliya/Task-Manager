import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import {
  FiUsers,
  FiFolder,
  FiCheckSquare,
  FiActivity,
  FiArrowRight,
  FiTrendingUp,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import "../../css/adminDashboard.css";
import { api } from "../../api/api";
import axios from "axios";

type ActivityItem = {
  id?: number | string;
  action?: string;
  message?: string;
  description?: string;
  actor_name?: string;
  created_at?: string;
  timestamp?: string;
  time?: string;
};

type DashboardSummary = {
  completed_tasks?: number;
  pending_reviews?: number;
  new_projects?: number;
  inactive_users?: number;
};

type DashboardResponse = {
  total_users?: number;
  active_projects?: number;
  open_tasks?: number;
  system_activity?: number | string;
  users_growth_text?: string;
  high_priority_projects?: number;
  tasks_due_this_week?: number;
  system_health_text?: string;
  recent_activity?: ActivityItem[];
  activity_logs?: ActivityItem[];
  summary?: DashboardSummary;

  stats?: {
    total_users?: number;
    active_projects?: number;
    open_tasks?: number;
    system_activity?: number | string;
    users_growth_text?: string;
    high_priority_projects?: number;
    tasks_due_this_week?: number;
    system_health_text?: string;
  };

  completed_tasks?: number;
  pending_reviews?: number;
  new_projects?: number;
  inactive_users?: number;
};

type ApiErrorResponse = {
  message?: string;
  detail?: string;
};

type DashboardCard = {
  title: string;
  description: string;
  wrapClass: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const DASHBOARD_API = "/admin/dashboard/";

function formatValue(
  value: string | number | null | undefined,
  fallback: string = "0"
): string | number {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0%";
  return typeof value === "number" ? `${value}%` : String(value);
}

function formatActivityTime(value?: string): string {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString();
}

function getActivityDotClass(action: string = ""): string {
  const normalized = action.toUpperCase();

  if (
    normalized.includes("CREATE") ||
    normalized.includes("ADD") ||
    normalized.includes("ASSIGN")
  ) {
    return "green";
  }

  if (
    normalized.includes("UPDATE") ||
    normalized.includes("EDIT") ||
    normalized.includes("STATUS")
  ) {
    return "blue";
  }

  if (normalized.includes("DELETE") || normalized.includes("REMOVE")) {
    return "red";
  }

  return "orange";
}

export default function AdminDashboard(): React.ReactNode {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchDashboard = async (isRefresh: boolean = false): Promise<void> => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get<DashboardResponse>(DASHBOARD_API);
      setDashboard(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data?.detail || err.message;
        setError(msg);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while loading dashboard.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    return {
      totalUsers: dashboard?.total_users ?? dashboard?.stats?.total_users ?? 0,
      activeProjects:
        dashboard?.active_projects ?? dashboard?.stats?.active_projects ?? 0,
      openTasks: dashboard?.open_tasks ?? dashboard?.stats?.open_tasks ?? 0,
      systemActivity:
        dashboard?.system_activity ?? dashboard?.stats?.system_activity ?? 0,
      usersGrowth:
        dashboard?.users_growth_text ??
        dashboard?.stats?.users_growth_text ??
        "+0 this month",
      highPriorityProjects:
        dashboard?.high_priority_projects ??
        dashboard?.stats?.high_priority_projects ??
        0,
      dueThisWeek:
        dashboard?.tasks_due_this_week ??
        dashboard?.stats?.tasks_due_this_week ??
        0,
      systemHealthText:
        dashboard?.system_health_text ??
        dashboard?.stats?.system_health_text ??
        "Healthy performance",
    };
  }, [dashboard]);

  const summary = useMemo(() => {
    return {
      completedTasks:
        dashboard?.summary?.completed_tasks ??
        dashboard?.completed_tasks ??
        0,
      pendingReviews:
        dashboard?.summary?.pending_reviews ??
        dashboard?.pending_reviews ??
        0,
      newProjects:
        dashboard?.summary?.new_projects ??
        dashboard?.new_projects ??
        0,
      inactiveUsers:
        dashboard?.summary?.inactive_users ??
        dashboard?.inactive_users ??
        0,
    };
  }, [dashboard]);

  const recentActivity: ActivityItem[] = useMemo(() => {
    return dashboard?.recent_activity ?? dashboard?.activity_logs ?? [];
  }, [dashboard]);

  const cardLinks: DashboardCard[] = [
    {
      title: "Users",
      description: "Manage all system users, roles, and account access from one place.",
      wrapClass: "users",
      icon: <FiUsers className="adminDashIcon" />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Projects",
      description: "Track project progress, members, deadlines, and overall delivery.",
      wrapClass: "projects",
      icon: <FiFolder className="adminDashIcon" />,
      onClick: () => navigate("/admin/projects"),
    },
    {
      title: "Tasks",
      description: "Monitor task status, priorities, assignments, and due dates easily.",
      wrapClass: "tasks",
      icon: <FiCheckSquare className="adminDashIcon" />,
      onClick: () => navigate("/admin/tasks"),
    },
    {
      title: "Activity",
      description: "Review platform events, updates, actions, and team activity logs.",
      wrapClass: "activity",
      icon: <FiActivity className="adminDashIcon" />,
      onClick: () => navigate("/admin/activity"),
    },
  ];

  if (loading) {
    return (
      <div className="adminDashboard">
        <div className="adminDashHero">
          <div>
            <p className="adminDashEyebrow">Admin Panel</p>
            <h2 className="adminDashTitle">Dashboard Overview</h2>
            <p className="adminDashSubtitle">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminDashboard">
      <div className="adminDashHero">
        <div>
          <p className="adminDashEyebrow">Admin Panel</p>
          <h2 className="adminDashTitle">Dashboard Overview</h2>
          <p className="adminDashSubtitle">
            Manage users, projects, tasks, and monitor overall platform activity.
          </p>
        </div>

        <button
          type="button"
          className="adminRefreshBtn"
          onClick={() => void fetchDashboard(true)}
          disabled={refreshing}
        >
          <FiRefreshCw />
          {refreshing ? " Refreshing..." : " Refresh"}
        </button>
      </div>

      {error ? (
        <div className="adminDashErrorBox">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="adminStatsGrid">
        <div className="adminStatCard">
          <div className="adminStatIcon users">
            <FiUsers />
          </div>
          <div>
            <p className="adminStatLabel">Total Users</p>
            <h3 className="adminStatValue">{formatValue(stats.totalUsers)}</h3>
            <span className="adminStatMeta positive">
              <FiTrendingUp /> {formatValue(stats.usersGrowth, "+0 this month")}
            </span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIcon projects">
            <FiFolder />
          </div>
          <div>
            <p className="adminStatLabel">Active Projects</p>
            <h3 className="adminStatValue">
              {formatValue(stats.activeProjects)}
            </h3>
            <span className="adminStatMeta">
              {formatValue(stats.highPriorityProjects)} high priority
            </span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIcon tasks">
            <FiCheckSquare />
          </div>
          <div>
            <p className="adminStatLabel">Open Tasks</p>
            <h3 className="adminStatValue">{formatValue(stats.openTasks)}</h3>
            <span className="adminStatMeta">
              {formatValue(stats.dueThisWeek)} due this week
            </span>
          </div>
        </div>

        <div className="adminStatCard">
          <div className="adminStatIcon activity">
            <FiActivity />
          </div>
          <div>
            <p className="adminStatLabel">System Activity</p>
            <h3 className="adminStatValue">
              {formatPercent(stats.systemActivity)}
            </h3>
            <span className="adminStatMeta positive">
              {formatValue(stats.systemHealthText, "Healthy performance")}
            </span>
          </div>
        </div>
      </div>

      <div className="adminDashGrid">
        {cardLinks.map((card) => (
          <div
            key={card.title}
            className="adminDashCard adminDashCardClickable"
            onClick={card.onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                card.onClick();
              }
            }}
          >
            <div className="adminDashCardTop">
              <div className={`adminDashIconWrap ${card.wrapClass}`}>
                {card.icon}
              </div>
              <FiArrowRight className="adminDashArrow" />
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>

      <div className="adminDashBottom">
        <div className="adminDashPanel recentActivityPanel">
          <div className="adminPanelHeader">
            <h3>Recent Activity</h3>
            <span>Latest updates</span>
          </div>

          <div className="activityList">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div
                  className="activityItem"
                  key={item.id ?? `${item.action ?? "activity"}-${index}`}
                >
                  <div
                    className={`activityDot ${getActivityDotClass(item.action)}`}
                  ></div>
                  <div>
                    <p className="activityText">
                      {item.message ||
                        item.description ||
                        `${item.actor_name || "System"} performed ${
                          item.action || "an action"
                        }`}
                    </p>
                    <span className="activityTime">
                      <FiClock />{" "}
                      {formatActivityTime(
                        item.created_at || item.timestamp || item.time
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="activityItem">
                <div className="activityDot blue"></div>
                <div>
                  <p className="activityText">No recent activity found.</p>
                  <span className="activityTime">
                    <FiClock /> Recently
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="adminDashPanel adminSummaryPanel">
          <div className="adminPanelHeader">
            <h3>Quick Summary</h3>
            <span>Today at a glance</span>
          </div>

          <div className="summaryGrid">
            <div className="summaryCard">
              <span>Completed Tasks</span>
              <strong>{formatValue(summary.completedTasks)}</strong>
            </div>
            <div className="summaryCard">
              <span>Pending Reviews</span>
              <strong>{formatValue(summary.pendingReviews)}</strong>
            </div>
            <div className="summaryCard">
              <span>New Projects</span>
              <strong>{formatValue(summary.newProjects)}</strong>
            </div>
            <div className="summaryCard">
              <span>Inactive Users</span>
              <strong>{formatValue(summary.inactiveUsers)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}