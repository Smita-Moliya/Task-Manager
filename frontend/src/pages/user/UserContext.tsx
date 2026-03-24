import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { Task } from "../../types/task";
import { Filters } from "../../types/dashboard";

type ActivityItem = {
  id: number;
  task_id: number;
  task_title: string;
  action: string;
  message: string;
  created_at: string;
};

const initialFilters: Filters = {
  q: "",
  status: "ALL",
  due: "ALL",
  sort: "DUE_SOON",
};

function countByStatus(tasks: Task[]) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const progress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  return { total, pending, progress, done };
}

type Ctx = {
  tasks: Task[];
  activities: ActivityItem[];
  activityPage: number;
  setActivityPage: React.Dispatch<React.SetStateAction<number>>;
  activityTotalPages: number;
  activityTotal: number;
  filteredTasks: Task[];
  stats: { total: number; pending: number; progress: number; done: number };
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  msg: string;
  reload: () => Promise<void>;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
};

const UserCtx = createContext<Ctx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [msg, setMsg] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const ACTIVITY_PAGE_SIZE = 10;

  async function loadTasks() {
    try {
      setMsg("");

      const tasksRes = await api.get("/user/tasks/");
      const data = tasksRes.data || {};

      const taskList = Array.isArray(data)
        ? data
        : data.tasks || data.items || data.results || [];

      setTasks(Array.isArray(taskList) ? taskList : []);
    } catch (e: any) {
      setTasks([]);
      setMsg(e?.response?.data?.message || "Failed to load tasks");
    }
  }

  async function loadActivities(page = 1) {
    try {
      const activityRes = await api.get(
        `/my-activity/?page=${page}&page_size=${ACTIVITY_PAGE_SIZE}`
      );

      const data = activityRes.data || {};
      const activityList = Array.isArray(data)
        ? data
        : data.activities || data.items || data.results || [];

      setActivities(Array.isArray(activityList) ? activityList : []);
      setActivityPage(data.page || page);
      setActivityTotalPages(data.total_pages || 1);
      setActivityTotal(data.total || activityList.length || 0);
    } catch (e: any) {
      setActivities([]);
      setActivityPage(1);
      setActivityTotalPages(1);
      setActivityTotal(0);
    }
  }

  async function reload() {
    setMsg("");
    await loadTasks();
    await loadActivities(activityPage);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    loadActivities(activityPage);
  }, [activityPage]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

    let out = [...tasks];

    if (filters.q.trim()) {
      const q = filters.q.toLowerCase();
      out = out.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }

    if (filters.status !== "ALL") {
      out = out.filter((t) => t.status === filters.status);
    }

    if (filters.due !== "ALL") {
      out = out.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);

        if (filters.due === "TODAY") return d >= startOfToday && d < endOfToday;
        if (filters.due === "THIS_WEEK") return d >= startOfToday && d < endOfWeek;
        if (filters.due === "OVERDUE") return d < startOfToday && t.status !== "DONE";

        return true;
      });
    }

    out.sort((a, b) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;

      if (filters.sort === "DUE_SOON") return ad - bd;
      if (filters.sort === "NEWEST") return b.id - a.id;
      if (filters.sort === "STATUS") return a.status.localeCompare(b.status);
      return 0;
    });

    return out;
  }, [tasks, filters]);

  const stats = useMemo(() => countByStatus(tasks), [tasks]);

  const value: Ctx = {
    tasks,
    activities,
    activityPage,
    setActivityPage,
    activityTotalPages,
    activityTotal,
    filteredTasks,
    stats,
    filters,
    setFilters,
    msg,
    reload,
    selectedTaskId,
    setSelectedTaskId,
  };

  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUserData must be used inside UserProvider");
  return ctx;
}