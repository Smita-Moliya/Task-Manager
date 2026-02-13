import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

type Task = {
  id: number;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  assigned_to: number;
  due_date: string | null;
};

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const [t, u] = await Promise.all([api.get("/tasks/"), api.get("/users/")]);
      setTasks(t.data.tasks || []);
      setUsers(u.data.users || []);
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    setBusy(true);
    setMsg("");
    try {
      await api.delete(`/tasks/${id}/admin/delete/`);
      setMsg("Deleted ✅");
      await load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Delete failed ❌");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="rowBetween">
        <div>
          <h3 className="cardTitle" style={{ marginBottom: 4 }}>All Tasks</h3>
        </div>

        <button className="btn" onClick={load} disabled={busy}>
          {busy ? "Loading..." : "Refresh"}
        </button>
      </div>

      {msg && <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>{msg}</div>}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 150 }}>Assigned To</th>
              <th style={{ width: 150 }}>Status</th>
              <th style={{ width: 120 }}>Due</th>
              <th style={{ width: 190 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const u = userMap.get(t.assigned_to);
              return (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.title}</td>
                  <td>{u?.name || `User #${t.assigned_to}`}</td>
                  <td>
                    <span className={`badge ${t.status === "DONE" ? "done" : t.status === "IN_PROGRESS" ? "progress" : "pending"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.due_date || "-"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => navigate(`/admin/tasks/${t.id}/edit`)}>
                      Edit
                    </button>
                    <button className="btn" onClick={() => del(t.id)} disabled={busy}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="emptyCell">No tasks found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
