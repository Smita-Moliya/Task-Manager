import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  assigned_to: number;
  due_date: string | null;
};

export default function EditTaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // LOAD TASK + USERS
  useEffect(() => {
    const load = async () => {
      try {
        const [t, u] = await Promise.all([
          api.get(`/tasks/${id}/`),
          api.get("/users/")
        ]);

        setTask(t.data.task || t.data); // handle both response styles

        const all: User[] = u.data.users || [];
        setUsers(all.filter(x => x.role === "USER"));
      } catch (e) {
        setMsg("Failed to load task");
      }
    };

    load();
  }, [id]);

  // UPDATE HANDLER
  const updateTask = async () => {
    if (!task) return;

    setBusy(true);
    setMsg("");

    try {
      await api.patch(`/tasks/${id}/`, {
        title: task.title,
        description: task.description,
        status: task.status,
        assigned_to: task.assigned_to,
        due_date: task.due_date
      });

      setMsg("Task updated ✅");

      setTimeout(() => navigate("/admin"), 900);

    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Update failed ❌");
    } finally {
      setBusy(false);
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="page">

      <h2>Edit Task</h2>

      {msg && (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>
          {msg}
        </div>
      )}

      {/* TITLE */}
      <div className="field">
        <label>Title</label>
        <input
          className="input"
          value={task.title}
          onChange={e => setTask({ ...task, title: e.target.value })}
        />
      </div>

      {/* DESCRIPTION */}
      <div className="field">
        <label>Description</label>
        <textarea
          className="input textarea"
          value={task.description || ""}
          onChange={e => setTask({ ...task, description: e.target.value })}
        />
      </div>

      {/* ASSIGNED USER */}
      <div className="field">
        <label>Assign To</label>
        <select
          className="input"
          value={task.assigned_to}
          onChange={e =>
            setTask({ ...task, assigned_to: Number(e.target.value) })
          }
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {/* STATUS */}
      <div className="field">
        <label>Status</label>
        <select
          className="input"
          value={task.status}
          onChange={e =>
            setTask({ ...task, status: e.target.value as Task["status"] })
          }
        >
          <option value="PENDING">PENDING</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
      </div>

      {/* DUE DATE */}
      <div className="field">
        <label>Due Date</label>
        <input
          type="date"
          className="input"
          value={task.due_date || ""}
          onChange={e => setTask({ ...task, due_date: e.target.value })}
        />
      </div>

      {/* BUTTONS */}
      <div style={{display:"flex", gap:10, marginTop:20}}>
        <button className="btn primary" onClick={updateTask} disabled={busy}>
          {busy ? "Updating..." : "Update Task"}
        </button>

        <button className="btn" onClick={()=>navigate("/admin")}>
          Cancel
        </button>
      </div>

    </div>
  );
}
