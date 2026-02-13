import { useEffect, useState } from "react";
import { api } from "../api/api";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  due_date: string | null;
};

const STATUS: Task["status"][] = ["PENDING", "IN_PROGRESS", "DONE"];

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setMsg("");
    const res = await api.get("/tasks/");
    setTasks(res.data.tasks || []);
  };

  useEffect(() => {
    load().catch(() => setMsg("Failed to load tasks"));
  }, []);

  const updateStatus = async (taskId: number, status: Task["status"]) => {
    setMsg("");
    setBusyId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/status/`, { status });
      setMsg("Status updated ✅");
      await load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Update failed ❌");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="rowBetween">
        <div>
          <h3 className="cardTitle" style={{ marginBottom: 4 }}>My Tasks</h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            You can update only your task status.
          </p>
        </div>
        <button className="btn" onClick={() => load()}>Refresh</button>
      </div>

      {msg && <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>{msg}</div>}

      <div className="tableWrap" style={{ marginTop: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 170 }}>Status</th>
              <th style={{ width: 120 }}>Due</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  {t.description && <div className="muted small">{t.description}</div>}
                </td>
                <td>
                  <select
                    className="input"
                    value={t.status}
                    disabled={busyId === t.id}
                    onChange={(e) => updateStatus(t.id, e.target.value as Task["status"])}
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>{t.due_date || "-"}</td>
              </tr>
            ))}

            {tasks.length === 0 && (
              <tr><td colSpan={4} className="emptyCell">No tasks assigned yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
