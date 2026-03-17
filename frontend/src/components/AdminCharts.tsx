import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { ByStatus, ByUser } from "../types/task";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";



const STATUS_LABEL: Record<ByStatus["status"], string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const COLORS = {
  pending: "#f59e0b",
  progress: "#3b82f6",
  done: "#10b981",
};
const USER_COLORS = [
  "#3bf63eae",
  "#ef1083",
  "#f50b26",
  "#8b5cf6",
  "#2c204d",
  "#06b6d4",
];
function formatCompact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rchTooltip">
      <div className="rchTooltipTitle">{label ?? p?.name}</div>
      <div className="rchTooltipRow">
        <span className="rchDot" style={{ background: p?.color || p?.payload?.fill }} />
        <span className="rchTooltipKey">{p?.dataKey || "count"}</span>
        <span className="rchTooltipVal">{p?.value}</span>
      </div>
    </div>
  );
}

export default function AdminCharts() {
  const [byStatus, setByStatus] = useState<ByStatus[]>([]);
  const [byUser, setByUser] = useState<ByUser[]>([]);
  const [msg, setMsg] = useState("");
  
  // UI controls
  const [topN, setTopN] = useState<"ALL" | 5 | 10>("ALL");
  const [userChart, setUserChart] = useState<"VERTICAL" | "HORIZONTAL">("VERTICAL");

  useEffect(() => {
    (async () => {
      setMsg("");
      try {
        const res = await api.get("/admin/stats/");
        setByStatus(res.data.by_status || []);
        setByUser(res.data.by_user || []);
      } catch (err: any) {
        setMsg(err?.response?.data?.message || "Failed to load stats");
      }
    })();
  }, []);

  const statusData = useMemo(() => {
    const order: ByStatus["status"][] = ["IN_PROGRESS", "PENDING", "DONE"];
    const map = new Map(byStatus.map((x) => [x.status, x.count]));
    return order.map((s) => ({ status: s, count: map.get(s) ?? 0 }));
  }, [byStatus]);

  const total = useMemo(
    () => statusData.reduce((sum, x) => sum + (x.count || 0), 0),
    [statusData]
  );

  const pendingCount = statusData.find((x) => x.status === "PENDING")?.count ?? 0;
  const progressCount = statusData.find((x) => x.status === "IN_PROGRESS")?.count ?? 0;
  const doneCount = statusData.find((x) => x.status === "DONE")?.count ?? 0;

  const statusColor = (s: ByStatus["status"]) => {
    if (s === "PENDING") return COLORS.pending;
    if (s === "IN_PROGRESS") return COLORS.progress;
    return COLORS.done;
  };

  const byUserSorted = useMemo(() => {
    const sorted = [...byUser].sort((a, b) => (b.count || 0) - (a.count || 0));
    if (topN === "ALL") return sorted;
    return sorted.slice(0, topN);
  }, [byUser, topN]);

  const bestPerformer = useMemo(() => {
    if (!byUserSorted.length) return "—";
    return `${byUserSorted[0].name} (${byUserSorted[0].count})`;
  }, [byUserSorted]);

  return (
    <div className="rchWrap">
      {msg && <div className="alert error">{msg}</div>}

      {/* ===== KPIs ===== */}
      <div className="rchKpis">
        <div className="rchKpiCard rchKpiTotal">
          <div className="rchKpiTop">
            <div className="rchKpiLabel">Total Tasks</div>
            <div className="rchKpiChip">All</div>
          </div>
          <div className="rchKpiValue">{formatCompact(total)}</div>
          <div className="rchKpiSub">Top performer: <b>{bestPerformer}</b></div>
        </div>

        <div className="rchKpiCard rchKpiPending">
          <div className="rchKpiTop">
            <div className="rchKpiLabel">Pending</div>
            <span className="rchKpiDot" />
          </div>
          <div className="rchKpiValue">{formatCompact(pendingCount)}</div>
          <div className="rchKpiSub">Needs attention</div>
        </div>

        <div className="rchKpiCard rchKpiProgress">
          <div className="rchKpiTop">
            <div className="rchKpiLabel">In progress</div>
            <span className="rchKpiDot" />
          </div>
          <div className="rchKpiValue">{formatCompact(progressCount)}</div>
          <div className="rchKpiSub">Currently running</div>
        </div>

        <div className="rchKpiCard rchKpiDone">
          <div className="rchKpiTop">
            <div className="rchKpiLabel">Done</div>
            <span className="rchKpiDot" />
          </div>
          <div className="rchKpiValue">{formatCompact(doneCount)}</div>
          <div className="rchKpiSub">Completed</div>
        </div>
      </div>

      {/* ===== CHART GRID ===== */}
      <div className="rchGrid">
        {/* Bar: Tasks by Status */}
        <div className="rchCard">
          <div className="rchHead">
            <div>
              <h3 className="rchTitle">Tasks by Status</h3>
              <div className="rchMuted">Quick view of pipeline</div>
            </div>
            <span className="rchPill">Overview</span>
          </div>

          <div className="rchBox rchBoxSm">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData} margin={{ top: 10, right: 16, left: 0, bottom: 6 }}>
                <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
                  tickFormatter={(v) => STATUS_LABEL[v as ByStatus["status"]] || v}
                  tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Gradient-ish look via stroke + hover css */}
                <Bar dataKey="count" radius={[14, 14, 6, 6]}>
                  {statusData.map((entry, index) => {
                    let color = COLORS.progress;

                    if (entry.status === "PENDING") color = COLORS.pending;
                    else if (entry.status === "IN_PROGRESS") color = COLORS.progress;
                    else if (entry.status === "DONE") color = COLORS.done;

                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut: Status Split */}
        <div className="rchCard">
          <div className="rchHead">
            <div>
              <h3 className="rchTitle">Status Split</h3>
              <div className="rchMuted">How work is distributed</div>
            </div>
            <span className="rchPill">Donut</span>
          </div>

          <div className="rchBox rchBoxSm">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={64}
                  outerRadius={96}
                  paddingAngle={5}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={3}
                  isAnimationActive
                >
                  {statusData.map((x, i) => (
                    <Cell key={i} fill={statusColor(x.status)} className="rchPieSlice" />
                  ))}
                </Pie>

                {/* Center label */}
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="rchCenterBig"
                >
                  {formatCompact(total)}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="rchCenterSmall"
                >
                  total tasks
                </text>

                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    const rawStatus = p?.name as ByStatus["status"];
                    return (
                      <div className="rchTooltip">
                        <div className="rchTooltipTitle">{STATUS_LABEL[rawStatus] || rawStatus}</div>
                        <div className="rchTooltipRow">
                          <span className="rchDot" style={{ background: p?.payload?.fill || p?.color }} />
                          <span className="rchTooltipKey">Count</span>
                          <span className="rchTooltipVal">{p?.value}</span>
                        </div>
                      </div>
                    );
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value: any) => STATUS_LABEL[value as ByStatus["status"]] || value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by User */}
        <div className="rchCard rchWide">
          <div className="rchHead">
            <div>
              <h3 className="rchTitle">Tasks by User</h3>
              <div className="rchMuted">Who is carrying the workload</div>
            </div>

            <div className="rchControls">
              <div className="rchSeg">
                <button
                  className={topN === "ALL" ? "rchSegBtn active" : "rchSegBtn"}
                  onClick={() => setTopN("ALL")}
                  type="button"
                >
                  All
                </button>
                <button
                  className={topN === 5 ? "rchSegBtn active" : "rchSegBtn"}
                  onClick={() => setTopN(5)}
                  type="button"
                >
                  Top 5
                </button>
                <button
                  className={topN === 10 ? "rchSegBtn active" : "rchSegBtn"}
                  onClick={() => setTopN(10)}
                  type="button"
                >
                  Top 10
                </button>
              </div>

              <div className="rchSeg">
                <button
                  className={userChart === "VERTICAL" ? "rchSegBtn active" : "rchSegBtn"}
                  onClick={() => setUserChart("VERTICAL")}
                  type="button"
                >
                  Vertical
                </button>
                <button
                  className={userChart === "HORIZONTAL" ? "rchSegBtn active" : "rchSegBtn"}
                  onClick={() => setUserChart("HORIZONTAL")}
                  type="button"
                >
                  Horizontal
                </button>
              </div>
            </div>
          </div>

          <div className="rchBox rchBoxLg">
            <ResponsiveContainer width="100%" height={380}>
              {userChart === "VERTICAL" ? (
                <BarChart data={byUserSorted} margin={{ top: 10, right: 16, left: 0, bottom: 40 }}>
                  <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[14, 14, 6, 6]}>
                    {byUser.map((_, index) => (
                      <Cell key={index} fill={USER_COLORS[index % USER_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={byUserSorted} layout="vertical" margin={{ top: 10, right: 16, left: 10, bottom: 10 }}>
                  <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: "#6b7280", fontWeight: 700, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[10, 10, 10, 10]} fill={COLORS.progress} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}