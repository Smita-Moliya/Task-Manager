import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiInbox,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import TaskDetailModal from "../../components/dashboard/TaskDetailModal";
import UserStatsOverview from "../../components/dashboard/UserStatsOverview";
import FocusTodayPanel from "../../components/dashboard/FocusTodayPanel";
import DueSummaryCard from "../../components/dashboard/DueSummaryCard";
import QuickActionsCard from "../../components/dashboard/QuickActionsCard";
import { useUserData } from "./UserContext";
import UserPageHeader from "./UserPageHeader";
import "../../css/userDashboard.css";

function isSameDay(dateString?: string | null) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isOverdue(dateString?: string | null, status?: string) {
  if (!dateString || status === "DONE") return false;
  const d = new Date(dateString);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  return d.getTime() < startToday.getTime();
}

export default function UserInsights() {
  const { tasks, reload, setSelectedTaskId } = useUserData();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => isSameDay(t.due_date) && t.status !== "DONE"),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t.due_date, t.status)),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "IN_PROGRESS"),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "DONE"),
    [tasks]
  );

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [tasks, completedTasks]);

  const focusTasks = useMemo(() => {
    const rank = (t: any) => {
      if (isOverdue(t.due_date, t.status)) return 1;
      if (isSameDay(t.due_date) && t.status !== "DONE") return 2;
      if (t.status === "IN_PROGRESS") return 3;
      return 4;
    };

    return [...tasks]
      .filter((t) => t.status !== "DONE")
      .sort((a, b) => {
        const ra = rank(a);
        const rb = rank(b);
        if (ra !== rb) return ra - rb;

        const ad = a.due_date
          ? new Date(a.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bd = b.due_date
          ? new Date(b.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        return ad - bd;
      })
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="userDashboardPage cleanDashboardPage">
      <UserPageHeader
        eyebrow="CONTROL CENTER"
        title="Welcome back"
        subtitle="Track priorities, due work, and your personal task progress from one place."
        rightSlot={<ThemeToggle />}
      />

      <div className="userDashboardContainer">
        <UserStatsOverview
          items={[
            {
              label: "Total Tasks",
              value: tasks.length,
              icon: <FiInbox />,
              helper: "All assigned tasks",
              tone: "neutral",
            },
            {
              label: "Due Today",
              value: dueTodayTasks.length,
              icon: <FiCalendar />,
              helper: "Need attention today",
              tone: "warning",
            },
            {
              label: "Overdue",
              value: overdueTasks.length,
              icon: <FiClock />,
              helper: "Past deadline",
              tone: "danger",
            },
            {
              label: "In Progress",
              value: inProgressTasks.length,
              icon: <FiTrendingUp />,
              helper: "Currently active",
              tone: "info",
            },
            {
              label: "Completed",
              value: completedTasks.length,
              icon: <FiCheckCircle />,
              helper: `${completionRate}% completion rate`,
              tone: "success",
            },
          ]}
        />

        <div className="userDashboardGrid cleanDashboardGrid">
          <FocusTodayPanel
            tasks={focusTasks}
            onOpen={(task) => {
              setSelectedId(task.id);
              setSelectedTaskId(task.id);
            }}
            onViewAll={() => navigate("/user/tasks")}
          />

          <div className="userDashboardSide">
            <DueSummaryCard
              dueToday={dueTodayTasks.length}
              overdue={overdueTasks.length}
              inProgress={inProgressTasks.length}
              completed={completedTasks.length}
            />

            <QuickActionsCard
              onRefresh={reload}
              onOpenTasks={() => navigate("/user/tasks")}
              onOpenActivity={() => navigate("/user/activity")}
              onOpenAttachments={() => navigate("/user/attachments")}
            />
          </div>
        </div>
      </div>

      <TaskDetailModal
        open={!!selectedId}
        taskId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </div>
  );
}