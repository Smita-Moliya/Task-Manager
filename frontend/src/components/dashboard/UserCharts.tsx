import { useMemo } from "react";
import { Task } from "../../types/task";
import { StatusKey } from "../../types/dashboard";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";


const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#f59e0b" },        // amber
  IN_PROGRESS: { label: "In progress", color: "#3b82f6" }, // blue
  DONE: { label: "Done", color: "#10b981" },               // green
};

const BUCKET_COLORS: Record<string, string> = {
  Overdue: "#ef4444",   // red
  Today: "#f59e0b",     // amber
  "This week": "#3b82f6", // blue
  Later: "#8b5cf6",     // purple
  "No due": "#94a3b8",  // slate
};

function prettyStatus(s: StatusKey) {
  return STATUS_META[s]?.label || String(s).replaceAll("_", " ").toLowerCase();
}

function statusColor(s: StatusKey) {
  return STATUS_META[s]?.color || "#64748b"; // fallback slate
}

function renderPieLabel(props: any) {
  const { percent, value } = props;
  if (!value) return "";
  // Show labels only when slice is meaningful (prevents clutter)
  if (percent < 0.08) return "";
  return `${Math.round(percent * 100)}%`;
}

export default function UserCharts({ tasks }: { tasks: Task[] }) {
  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.status, (map.get(t.status) || 0) + 1);

    // consistent order looks better
    const order = ["PENDING", "IN_PROGRESS", "DONE"];
    const arr = Array.from(map.entries()).map(([status, count]) => ({
      status,
      count,
      label: prettyStatus(status),
      color: statusColor(status),
    }));

    arr.sort((a, b) => {
      const ia = order.indexOf(a.status);
      const ib = order.indexOf(b.status);
      if (ia === -1 && ib === -1) return a.status.localeCompare(b.status);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return arr;
  }, [tasks]);

  const dueBuckets = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

    let overdue = 0,
      today = 0,
      week = 0,
      later = 0,
      none = 0;

    for (const t of tasks) {
      if (t.status === "DONE") continue;

      if (!t.due_date) {
        none++;
        continue;
      }

      const d = new Date(t.due_date);

      if (d < startToday) overdue++;
      else if (d.getTime() < startToday.getTime() + 24 * 60 * 60 * 1000) today++;
      else if (d < endWeek) week++;
      else later++;
    }

    return [
      { bucket: "Overdue", count: overdue, color: BUCKET_COLORS["Overdue"] },
      { bucket: "Today", count: today, color: BUCKET_COLORS["Today"] },
      { bucket: "This week", count: week, color: BUCKET_COLORS["This week"] },
      { bucket: "Later", count: later, color: BUCKET_COLORS["Later"] },
      { bucket: "No due", count: none, color: BUCKET_COLORS["No due"] },
    ];
  }, [tasks]);

  const done = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;

  const hasAnyTask = tasks.length > 0;
  const hasMultipleStatuses = byStatus.length > 1;

  return (
    <div className="chartsWrap">
      {/* Top KPI */}
      <div
        className="muted"
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span>
          Productivity:{" "}
          <b style={{ color: completionRate >= 60 ? "#10b981" : completionRate >= 30 ? "#3b82f6" : "#f59e0b" }}>
            {completionRate}%
          </b>{" "}
          completed
        </span>

        <span style={{ opacity: 0.85 }}>
          Total tasks: <b>{total}</b> • Done: <b>{done}</b>
        </span>
      </div>

      {/* Pie */}
      <div className="chartBox">
        <div className="chartTitle">Tasks by status</div>

        {!hasAnyTask ? (
          <div className="muted" style={{ padding: 16 }}>
            No tasks yet. Create your first task to see insights here.
          </div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [value, props?.payload?.label || name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.35)",
                    boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
                  }}
                />
                <Legend
                  formatter={(value: any, entry: any) => entry?.payload?.label || value}
                />
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={90}
                  innerRadius={52}
                  paddingAngle={hasMultipleStatuses ? 3 : 0}
                  labelLine={false}
                  label={renderPieLabel}
                  isAnimationActive
                >
                  {byStatus.map((item) => (
                    <Cell key={item.status} fill={item.color} stroke="rgba(255,255,255,0.9)" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bars */}
      <div className="chartBox">
        <div className="chartTitle">Due buckets (open tasks)</div>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={dueBuckets} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="4 4" opacity={0.35} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: any) => [value, "Tasks"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.35)",
                  boxShadow: "0 10px 30px rgba(2,6,23,0.12)",
                }}
              />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} isAnimationActive>
                {dueBuckets.map((b) => (
                  <Cell key={b.bucket} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}