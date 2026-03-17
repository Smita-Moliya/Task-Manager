import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/api";
import { AttachmentRow } from "../../types/task";

type Task = { id: number; title: string };

type DuplicateConflict = {
  existing_attachment_id: number;
  file_name: string;
};

export default function UserAttachments() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState<number | "">("");
  const [files, setFiles] = useState<FileList | null>(null);

  const [items, setItems] = useState<AttachmentRow[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showDuplicateBox, setShowDuplicateBox] = useState(false);
  const [duplicateConflicts, setDuplicateConflicts] = useState<DuplicateConflict[]>([]);

  async function loadTasks() {
    try {
      const res = await api.get("/tasks/");
      const list = Array.isArray(res.data) ? res.data : res.data?.tasks || [];
      const t = (Array.isArray(list) ? list : []).map((x: any) => ({
        id: x.id,
        title: x.title,
      }));
      setTasks(t);
    } catch {
      setTasks([]);
    }
  }

  async function loadAttachments() {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/me/attachments/");
      const list = res.data?.attachments ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setItems([]);
      setMsg(e?.response?.data?.message || "Failed to load attachments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    loadAttachments();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((a) =>
      `${a.original_name} ${a.task_id} ${a.task_title || ""}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  async function doUpload(duplicateAction?: "keep" | "replace") {
    setMsg("");

    if (!taskId) {
      setMsg("Please select a task first.");
      return;
    }

    if (!files || files.length === 0) {
      setMsg("Please select at least one file.");
      return;
    }

    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));

    if (duplicateAction) {
      fd.append("duplicate_action", duplicateAction);
    }

    setUploading(true);
    try {
      const res = await api.post(`/tasks/${taskId}/attachments/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg(res.data?.message || "Uploaded ✅");
      setFiles(null);
      setTaskId("");
      setShowDuplicateBox(false);
      setDuplicateConflicts([]);
      await loadAttachments();
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      if (status === 409 && data?.duplicate) {
        setShowDuplicateBox(true);
        setDuplicateConflicts(data?.conflicts || []);
        setMsg(
          data?.message ||
          "File already exists. Do you want to keep both files or replace the existing one?"
        );
      } else {
        setShowDuplicateBox(false);
        setDuplicateConflicts([]);
        setMsg(data?.message || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  }

  function cancelDuplicateFlow() {
    setShowDuplicateBox(false);
    setDuplicateConflicts([]);
    setMsg("Upload cancelled");
  }

  async function handleDownload(a: AttachmentRow) {
    try {
      setMsg("");

      const res = await api.get(a.download_url.replace(/^\/api/, ""), {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = a.original_name || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Download failed");
    }
  }

  return (
    <div>
      {msg ? (
        <div
          className={`alert ${msg.includes("✅") ? "success" : "error"}`}
          style={{ marginBottom: 12 }}
        >
          {msg}
        </div>
      ) : null}

      <section className="adminCard uaUploadCard" style={{ marginBottom: 14 }}>
        <div className="adminCardHead">
          <div>
            <h3>Upload Attachments</h3>
            <p className="uaHeadSub">Attach files to a selected task and manage duplicates easily.</p>
          </div>
          <span className="adminChip">Task based</span>
        </div>
        <div className="adminCardBody">
          <div className="uaUploadGrid">
            <div className="uaField">
              <label className="uaLabel">Select task</label>
              <select
                className="input uaInput"
                value={taskId}
                onChange={(e) => {
                  setTaskId(e.target.value ? Number(e.target.value) : "");
                  setShowDuplicateBox(false);
                  setDuplicateConflicts([]);
                  setMsg("");
                }}
              >
                <option value="">Choose a task…</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="uaField">
              <label className="uaLabel">Choose file(s)</label>

              <label className="uaFilePicker">
                <input
                  className="uaFileInputHidden"
                  type="file"
                  multiple
                  onChange={(e) => {
                    setFiles(e.target.files);
                    setShowDuplicateBox(false);
                    setDuplicateConflicts([]);
                    setMsg("");
                  }}
                />

                <span className="uaFilePickerBtn">Choose Files</span>

                <span className="uaFilePickerText">
                  {files && files.length > 0
                    ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                    : "No file chosen"}
                </span>
              </label>
            </div>

            <div className="uaActionCell">
              <button
                type="button"
                className="adminBtn adminBtnPrimary uaUploadBtn"
                onClick={() => doUpload()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload files"}
              </button>
            </div>
          </div>

          <div className="uaHint">
            Files will be uploaded to the selected task and shown in your attachment list below.
          </div>

          {files && files.length > 0 ? (
            <div className="uaSelectedFiles">
              <div className="uaSelectedFilesTitle">Selected files</div>
              <div className="uaFileChips">
                {Array.from(files).map((f, idx) => (
                  <span key={`${f.name}-${idx}`} className="uaFileChip">
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}


          {showDuplicateBox ? (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                border: "1px solid #e6dcc4",
                borderRadius: 12,
                background: "#fff8e8",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Some selected files already exist in this task.
              </div>

              <div style={{ marginBottom: 10 }}>
                Do you want to keep both files or replace the existing ones?
              </div>

              {duplicateConflicts.length > 0 ? (
                <ul style={{ margin: "0 0 12px 18px" }}>
                  {duplicateConflicts.map((c) => (
                    <li key={c.existing_attachment_id}>{c.file_name}</li>
                  ))}
                </ul>
              ) : null}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="adminBtn adminBtnPrimary"
                  onClick={() => doUpload("keep")}
                  disabled={uploading}
                >
                  Keep both
                </button>

                <button
                  type="button"
                  className="adminBtn adminBtnGhost"
                  onClick={() => doUpload("replace")}
                  disabled={uploading}
                >
                  Replace
                </button>

                <button
                  type="button"
                  className="adminBtn adminBtnGhost"
                  onClick={cancelDuplicateFlow}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by file name / task id / task title…"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="adminBtn adminBtnGhost"
          onClick={loadAttachments}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="muted" style={{ padding: 10 }}>
          Loading…
        </div>
      ) : null}

      <section className="adminCard">
        <div className="adminCardHead">
          <h3>All Attachments</h3>
          <span className="adminChip">{filtered.length}</span>
        </div>

        <div className="adminCardBody">
          {filtered.length === 0 ? (
            <div className="muted">No attachments found.</div>
          ) : (
            <div className="tableWrap" style={{ border: "none" }}>
              <table className="usersTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Task</th>
                    <th>Uploaded</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.original_name}</td>
                      <td>
                        #{a.task_id}
                        {a.task_title ? (
                          <span className="muted"> — {a.task_title}</span>
                        ) : null}
                      </td>
                      <td>{a.uploaded_at ? String(a.uploaded_at).slice(0, 10) : "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="adminBtn adminBtnGhost"
                          onClick={() => handleDownload(a)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}