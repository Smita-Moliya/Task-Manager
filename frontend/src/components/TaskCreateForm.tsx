import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };
type Project = { id: number; name: string };
type Member = { user_id: number; name: string; member_role: string };

export default function CreateTaskForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [projectId, setProjectId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res = await api.get("/projects/");
      const list = res.data?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setProjects([]);
      setMsg("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadMembers(pid: string) {
    if (!pid) return;
    setLoadingMembers(true);
    try {
      const res = await api.get(`/projects/${pid}/members/`);
      const list = res.data?.members || [];
      setMembers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setMembers([]);
      setMsg("Failed to load project members");
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      setAssignedTo("");
      return;
    }
    loadMembers(projectId);
  }, [projectId]);

  const fileLabel = useMemo(() => {
    if (!files.length) return "No files chosen";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  async function createTask() {
    const t = title.trim();

    if (!projectId) return setMsg("Please select a project");
    if (!t) return setMsg("Title is required");
    if (!assignedTo) return setMsg("Please select a project member");

    setBusy(true);
    setMsg("");

    try {
      const fd = new FormData();

      fd.append("title", t);
      fd.append("project_id", projectId);
      fd.append("assigned_to", assignedTo);

      if (dueDate) fd.append("due_date", dueDate);
      if (description.trim()) fd.append("description", description.trim());

      files.forEach((f) => fd.append("files", f));

      const res = await api.post("/tasks/", fd);

      setMsg(res.data?.message || "Task created ✅");

      setTitle("");
      setAssignedTo("");
      setDueDate("");
      setDescription("");
      setFiles([]);
      setProjectId("");
      setMembers([]);
    } catch (e: any) {
      setMsg(
        e?.response?.data?.message ||
          e?.response?.data?.detail ||
          "Create task failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {msg ? (
        <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>
          {msg}
        </div>
      ) : null}

      {/* Project Selection */}
      <div className="field">
        <label className="label">Project</label>
        <select
          className="input"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={busy || loadingProjects}
        >
          <option value="">
            {loadingProjects ? "Loading projects..." : "Select project"}
          </option>

          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="field">
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          placeholder="e.g. Update inventory report"
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Assign member */}
      <div className="field">
        <label className="label">Assign To</label>
        <select
          className="input"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          disabled={busy || loadingMembers || !projectId}
        >
          <option value="">
            {loadingMembers ? "Loading members..." : "Select project member"}
          </option>

          {members.map((m) => (
            <option key={m.user_id} value={String(m.user_id)}>
              {m.name} ({m.member_role})
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div className="field">
        <label className="label">Due Date</label>
        <input
          className="input"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Attachments */}
      <div className="field">
        <label className="label">Attachments</label>

        <input
          id="taskFiles"
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          disabled={busy}
          style={{ display: "none" }}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label
            htmlFor="taskFiles"
            className="btn ghost"
            style={{ cursor: busy ? "not-allowed" : "pointer" }}
          >
            Choose Files
          </label>

          <div className="muted small">{fileLabel}</div>

          {files.length ? (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setFiles([])}
              disabled={busy}
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="muted small" style={{ marginTop: 6 }}>
          You can attach multiple documents.
        </div>
      </div>

      {/* Description */}
      <div className="field">
        <label className="label">Description</label>
        <textarea
          className="input"
          value={description}
          placeholder="Write task details..."
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          style={{ minHeight: 110, resize: "vertical" }}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <button className="btn primary" onClick={createTask} disabled={busy}>
          {busy ? "Creating..." : "Create Task"}
        </button>
      </div>
    </>
  );
}