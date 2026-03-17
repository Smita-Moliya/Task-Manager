import { useEffect, useState } from "react";
import { api } from "../api/api";
import TaskList from "./dashboard/TaskList";
import TaskDetailModal from "./dashboard/TaskDetailModal";
import type { Task } from "../types/task";

export default function AdminTaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/tasks/");
      const list = res.data?.tasks;
      setTasks(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setTasks([]);
      setMsg(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <>
      {msg ? <div className="alert error">{msg}</div> : null}
      {loading ? <div className="muted">Loading tasks...</div> : null}

      <TaskList tasks={tasks} onOpen={setSelected} />

      <TaskDetailModal
        open={!!selected}
        taskId={selected?.id ?? null}
        onClose={() => setSelected(null)}
        onChanged={loadTasks}
      />
    </>
  );
}
