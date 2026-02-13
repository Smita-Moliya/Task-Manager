import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  assigned_by: number;
  assigned_to: number;
  due_date: string | null;
};

const STATUS: Task["status"][] = ["PENDING", "IN_PROGRESS", "DONE"];

export default function TaskManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Small filters
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState<number | "">("");

  const userMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const filteredTasks = useMemo(() => {
    const s = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const okUser = filterUser === "" ? true : t.assigned_to === filterUser;
      const okSearch =
        !s ||
        t.title.toLowerCase().includes(s) ||
        (t.description || "").toLowerCase().includes(s);
      return okUser && okSearch;
    });
  }, [tasks, search, filterUser]);

  const load = async () => {
    setMsg("");
    setBusy(true);
    try {
      const [u, t] = await Promise.all([api.get("/users/"), api.get("/tasks/")]);
      const allUsers: User[] = u.data.users || [];
      setUsers(allUsers);
      setTasks(t.data.tasks || []);
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to load data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    if (!title.trim()) return "Title is required";
    if (assignedTo === "") return "Please select user";
    return "";
  };

  const createTask = async () => {
    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      await api.post("/tasks/", {
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo,
        due_date: dueDate || null,
      });

      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setMsg("Task created ✅");
      await load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Create failed ❌");
    } finally {
      setBusy(false);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    setBusy(true);
    setMsg("");
    try {
      await api.delete(`/tasks/${id}/`);
      setMsg("Deleted ✅");
      await load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Delete failed ❌");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card taskCard">
      <div className="taskHeader">
        <div>
          <h3 className="cardTitle" style={{ marginBottom: 4 }}>
            Task Manager
          </h3>
          <p className="muted small" style={{ marginTop: 0 }}>
            Create & assign tasks • Admin sees all tasks
          </p>
        </div>

        <div className="taskHeaderRight">
          <input
            className="input"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input"
            value={filterUser}
            onChange={(e) => setFilterUser(Number(e.target.value) || "")}
            style={{ minWidth: 180 }}
          >
            <option value="">All users</option>
            {users
              .filter((u) => u.role === "USER")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>

          <button className="btn" onClick={load} disabled={busy}>
            {busy ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>
          {msg}
        </div>
      )}

      {/* Create task form */}
      <div className="taskForm">
        <div className="field">
          <label>Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Eg: Finish React CRUD"
          />
        </div>

        <div className="field">
          <label>Assign To</label>
          <select
            className="input"
            value={assignedTo}
            onChange={(e) => setAssignedTo(Number(e.target.value) || "")}
          >
            <option value="">Select user</option>
            {users
              .filter((u) => u.role === "USER")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
          </select>
        </div>

        <div className="field">
          <label>Due Date</label>
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="field taskDesc">
          <label>Description</label>
          <textarea
            className="input textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details…"
          />
        </div>

        <button className="btn primary taskCreateBtn" onClick={createTask} disabled={busy}>
          Create Task
        </button>
      </div>

      {/* Tasks table */}
      <div className="tableWrap" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 160 }}>Assigned To</th>
              <th style={{ width: 150 }}>Status</th>
              <th style={{ width: 120 }}>Due</th>
              <th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTasks.map((t) => {
              const assignedUser = userMap.get(t.assigned_to);
              return (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <div className="taskTitleCell">{t.title}</div>
                    {t.description && (
                      <div className="taskSub">{t.description}</div>
                    )}
                  </td>
                  <td>
                    <div className="taskAssignee">
                      <div className="avatar">{(assignedUser?.name || "?")[0]?.toUpperCase()}</div>
                      <div>
                        <div className="taskAssigneeName">{assignedUser?.name || `User #${t.assigned_to}`}</div>
                        <div className="taskSub">{assignedUser?.email || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        t.status === "DONE"
                          ? "done"
                          : t.status === "IN_PROGRESS"
                          ? "progress"
                          : "pending"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>{t.due_date || "-"}</td>
                  <td>
                    <button className="btn" onClick={() => deleteTask(t.id)} disabled={busy}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="emptyCell">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
