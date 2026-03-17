import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../api/api";
import { Task } from "../types/task";
import { Attachment } from "../types/task";

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusDraft, setStatusDraft] = useState<Record<number, Task["status"]>>({});

  const load = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.get("/tasks/");
      const list = res.data.tasks || [];
      setTasks(list);

      const draft: Record<number, Task["status"]> = {};
      list.forEach((t: Task) => {
        draft[t.id] = t.status;
      });
      setStatusDraft(draft);

    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadAttachment = async (a: Attachment) => {
    try {
      const access = localStorage.getItem("access");
      const url = `http://127.0.0.1:8000${a.download_url}`;

      const res = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${access}` },
      });

      const blobUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = a.original_name;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Download failed");
    }
  };

  const updateStatus = async (taskId: number, newStatus: Task["status"]) => {
    try {
      // optimistic UI update (instant)
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await api.patch(`/tasks/${taskId}/status/`, { status: newStatus });
    } catch (err: any) {
      // rollback if failed
      await load();
      alert(err?.response?.data?.message || "Failed to update status");
    }
  };


  return (
    <div>
      <div className="rowBetween" style={{ marginBottom: 10 }}>
        <div className="muted small">
          {busy ? "Loading..." : `${tasks.length} task(s)`}
        </div>
        <button className="btn" onClick={load} disabled={busy}>
          {busy ? "Loading..." : "Refresh"}
        </button>
      </div>

      {msg && <div className="alert error">{msg}</div>}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 150 }}>Status</th>
              <th style={{ width: 120 }}>Due</th>
              <th style={{ width: 260 }}>Documents</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>

                <td>
                  <div className="taskTitleCell">{t.title}</div>
                  {t.description ? <div className="taskSub">{t.description}</div> : null}
                </td>

                <td>
                  <select
                    className="input"
                    style={{ padding: "6px 10px", borderRadius: 10 }}
                    value={statusDraft[t.id] || t.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Task["status"];

                      // update dropdown state immediately
                      setStatusDraft((prev) => ({ ...prev, [t.id]: newStatus }));

                      // call backend immediately
                      updateStatus(t.id, newStatus);
                    }}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </td>



                <td>{t.due_date || "-"}</td>

                <td>
                  {t.attachments && t.attachments.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {t.attachments.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ fontSize: 13, color: "#111827" }}>
                            {a.original_name}
                          </div>

                          <button className="btn" onClick={() => downloadAttachment(a)}>
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="muted small">No documents</span>
                  )}
                </td>
              </tr>
            ))}

            {tasks.length === 0 && !busy && (
              <tr>
                <td colSpan={5} className="emptyCell">
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
