import { useEffect, useMemo, useState } from "react";
import {
  FiUploadCloud,
  FiSearch,
  FiRefreshCw,
  FiPaperclip,
  FiDownload,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
  FiFolder,
} from "react-icons/fi";
import { api } from "../../api/api";
import { AttachmentRow } from "../../types/task";
import UserPageHeader from "../../pages/user/UserPageHeader";
import ThemeToggle from "../../components/ThemeToggle";
import "../../css/userAttachments.css";

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

  const selectedFilesCount = files?.length || 0;

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

      setMsg(res.data?.message || "Uploaded successfully ✅");
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
    <div className="uaPage">
      {msg ? (
        <div className={`uaAlert ${msg.includes("✅") ? "success" : "error"}`}>
          <span className="uaAlertIcon">
            {msg.includes("✅") ? <FiCheckCircle /> : <FiAlertTriangle />}
          </span>
          <span>{msg}</span>
        </div>
      ) : null}

        <UserPageHeader
          eyebrow="FILES"
          title="Attachments"
          subtitle="Upload, manage, search, and download your task files from one place."
          rightSlot={<ThemeToggle />}
        />
      

      <section className="uaHeroStats">
        <div className="uaStatCard">
          <div className="uaStatIcon">
            <FiPaperclip />
          </div>
          <div>
            <div className="uaStatValue">{items.length}</div>
            <div className="uaStatLabel">Total attachments</div>
          </div>
        </div>

        <div className="uaStatCard">
          <div className="uaStatIcon">
            <FiFolder />
          </div>
          <div>
            <div className="uaStatValue">{tasks.length}</div>
            <div className="uaStatLabel">Available tasks</div>
          </div>
        </div>

        <div className="uaStatCard">
          <div className="uaStatIcon">
            <FiUploadCloud />
          </div>
          <div>
            <div className="uaStatValue">{selectedFilesCount}</div>
            <div className="uaStatLabel">Selected files</div>
          </div>
        </div>
      </section>

      <section className="adminCard uaUploadCard">
        <div className="adminCardHead uaSectionHead">
          <div>
            <h3>Upload Attachments</h3>
            <p className="uaHeadSub">
              Choose a task, attach one or more files, and keep your work organized.
            </p>
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

            <div className="uaField uaFieldWide">
              <label className="uaLabel">Choose files</label>
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
                <span className="uaFilePickerBtn">Browse Files</span>
                <span className="uaFilePickerText">
                  {files && files.length > 0
                    ? `${files.length} file${files.length > 1 ? "s" : ""} selected`
                    : "No files selected"}
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
                <FiUploadCloud />
                <span>{uploading ? "Uploading..." : "Upload files"}</span>
              </button>
            </div>
          </div>

          <div className="uaHint">
            Uploaded files will be linked to the selected task and shown in the list below.
          </div>

          {files && files.length > 0 ? (
            <div className="uaSelectedFiles">
              <div className="uaSelectedFilesTitle">Selected files</div>
              <div className="uaFileChips">
                {Array.from(files).map((f, idx) => (
                  <span key={`${f.name}-${idx}`} className="uaFileChip">
                    <FiFileText />
                    <span>{f.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {showDuplicateBox ? (
            <div className="uaDuplicateBox">
              <div className="uaDuplicateTitle">
                <FiAlertTriangle />
                <span>Duplicate files detected</span>
              </div>

              <p className="uaDuplicateText">
                Some selected files already exist for this task. Choose how you want to continue.
              </p>

              {duplicateConflicts.length > 0 ? (
                <div className="uaDuplicateList">
                  {duplicateConflicts.map((c) => (
                    <div key={c.existing_attachment_id} className="uaDuplicateItem">
                      {c.file_name}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="uaDuplicateActions">
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
                  Replace existing
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

      <section className="uaToolbar">
        <div className="uaSearchBox">
          <FiSearch className="uaSearchIcon" />
          <input
            className="uaSearchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by file name, task id, or task title..."
          />
        </div>

        <button type="button" className="adminBtn adminBtnGhost uaRefreshBtn" onClick={loadAttachments}>
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </section>

      {loading ? <div className="uaLoading">Loading attachments...</div> : null}

      <section className="adminCard uaListCard">
        <div className="adminCardHead uaSectionHead">
          <div>
            <h3>All Attachments</h3>
            <p className="uaHeadSub">Review all uploaded files and download them anytime.</p>
          </div>
          <span className="adminChip">{filtered.length}</span>
        </div>

        <div className="adminCardBody">
          {filtered.length === 0 ? (
            <div className="uaEmptyState">
              <FiPaperclip />
              <h4>No attachments found</h4>
              <p>Try uploading files or changing your search.</p>
            </div>
          ) : (
            <div className="uaTableWrap">
              <table className="usersTable uaTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File</th>
                    <th>Task</th>
                    <th>Uploaded</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="uaIdBadge">#{a.id}</span>
                      </td>

                      <td>
                        <div className="uaFileCell">
                          <span className="uaFileCellIcon">
                            <FiFileText />
                          </span>
                          <div className="uaFileMeta">
                            <div className="uaFileName">{a.original_name}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="uaTaskCell">
                          <span className="uaTaskMain">#{a.task_id}</span>
                          {a.task_title ? (
                            <span className="uaTaskSub">{a.task_title}</span>
                          ) : null}
                        </div>
                      </td>

                      <td>{a.uploaded_at ? String(a.uploaded_at).slice(0, 10) : "—"}</td>

                      <td>
                        <button
                          type="button"
                          className="adminBtn adminBtnGhost uaDownloadBtn"
                          onClick={() => handleDownload(a)}
                        >
                          <FiDownload />
                          <span>Download</span>
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