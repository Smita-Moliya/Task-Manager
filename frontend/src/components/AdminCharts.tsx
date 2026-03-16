import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
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

type ByStatus = { status: "PENDING" | "IN_PROGRESS" | "DONE"; count: number };
type ByUser = { name: string; count: number };

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
        <span className="rchDot" style={{ background: p?.color }} />
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
    // Ensure stable order: IN_PROGRESS, PENDING, DONE (looks nicer)
    const order: ByStatus["status"][] = ["IN_PROGRESS", "PENDING", "DONE"];
    const map = new Map(byStatus.map((x) => [x.status, x.count]));
    return order.map((s) => ({ status: s, count: map.get(s) ?? 0 }));
  }, [byStatus]);

  const total = useMemo(
    () => statusData.reduce((sum, x) => sum + (x.count || 0), 0),
    [statusData]
  );

  const statusColor = (s: ByStatus["status"]) => {
    if (s === "PENDING") return COLORS.pending;
    if (s === "IN_PROGRESS") return COLORS.progress;
    return COLORS.done;
  };

  return (
    <div className="rchGrid">
      {msg && <div className="alert error">{msg}</div>}

      {/* Bar: Tasks by Status */}
      <div className="rchCard">
        <div className="rchHead">
          <h3 className="rchTitle">Tasks by Status</h3>
          <span className="rchPill">Overview</span>
        </div>

        <div className="rchBox rchBoxSm" >
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
              <Bar dataKey="count" radius={[12, 12, 0, 0]} fill={COLORS.progress} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut: Tasks by Status */}
      <div className="rchCard">
        <div className="rchHead">
          <h3 className="rchTitle">Status Split</h3>
          <span className="rchPill">Donut</span>
        </div>

        <div className="rchBox rchBoxSm">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={4}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={3}
              >
             {statusData.map((x, i) => (
                  <Cell key={i} fill={statusColor(x.status)} />
                ))}
              </Pie>

              {/* Center label */}
              <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="rchCenterBig">
                {formatCompact(total)}
              </text>
              <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="rchCenterSmall">
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

      {/* Bar: Tasks by User */}
      <div className="rchCard rchWide">
        <div className="rchHead">
          <h3 className="rchTitle">Tasks by User</h3>
          <span className="rchPill">Distribution</span>
        </div>

        <div className="rchBox rchBoxLg">
          <ResponsiveContainer width="100%" height={360}> 
            <BarChart data={byUser} margin={{ top: 10, right: 16, left: 0, bottom: 30 }}>
              <CartesianGrid stroke="rgba(17,24,39,0.08)" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
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
              <Bar dataKey="count" radius={[12, 12, 0, 0]} fill={COLORS.progress} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
