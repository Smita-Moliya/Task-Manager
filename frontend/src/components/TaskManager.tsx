import { useEffect, useMemo, useState } from "react";
import { FiCheckSquare, FiClipboard, FiFolder, FiPaperclip } from "react-icons/fi";
import { api } from "../api/api";
import EditTaskModal from "./EditTaskModal";
import DashboardAttachments from "./dashboard/DashboardAttachments";
import DashboardComments from "./dashboard/DashboardComments";
import { TaskStatus, Task } from "../types/task";
import { User } from "../types/user";
import "../css/task.css"
function prettyDue(due: string | null) {
  if (!due) return "—";
  const dt = new Date(String(due).slice(0, 10));
  if (isNaN(dt.getTime())) return String(due).slice(0, 10);
  return dt.toLocaleDateString();
}

function statusBadge(status: TaskStatus) {
  if (status === "DONE") return { label: "Done", cls: "done" };
  if (status === "IN_PROGRESS") return { label: "In Progress", cls: "progress" };
  return { label: "Pending", cls: "pending" };
}

type ProjectTaskGroup = {
  key: string;
  projectId: number;
  projectName: string;
  tasks: Task[];
};

type TaskTab = "project" | "personal";

export default function TaskManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<TaskTab>("project");

  const userMap = useMemo(() => {
    const m = new Map<number, User>();
    users.forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const projectTasks = tasks;
  const personalTasks = tasks;

  const groupedProjectTasks = useMemo<ProjectTaskGroup[]>(() => {
    const groups = new Map<string, ProjectTaskGroup>();

    projectTasks.forEach((task) => {
      const projectId = Number(task.project_id);
      const key = `project-${projectId}`;
      const projectName = task.project_name || `Project #${projectId}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          projectId,
          projectName,
          tasks: [],
        });
      }

      groups.get(key)!.tasks.push(task);
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName)
    );
  }, [projectTasks]);

  async function loadUsers() {
    try {
      const res = await api.get("/users/", {
        params: { page: 1, page_size: 500 },
      });

      const rawUsers = Array.isArray(res.data?.users)
        ? res.data.users
        : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data)
            ? res.data
            : [];

      const onlyUsers = rawUsers.filter((u: User) => u.role === "USER");
      setUsers(onlyUsers);
    } catch {
      setUsers([]);
    }
  }

  async function loadTasks(p = page) {
    setMsg("");
    setBusy(true);

    try {
      const res = await api.get("/tasks/", {
        params: {
          page: p,
          page_size: pageSize,
          type: activeTab,
          q: search.trim() || undefined,
          assigned_to: filterUser === "" ? undefined : Number(filterUser),
        },
      });

      const items = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.tasks)
          ? res.data.tasks
          : Array.isArray(res.data)
            ? res.data
            : [];

      setTasks(items);

      const nextPage = Number(res.data?.page || p || 1);
      const nextTotalPages = Number(res.data?.total_pages || 1);
      const nextTotal = Number(res.data?.total || items.length || 0);

      setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
      setTotalPages(
        Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1
      );
      setTotal(Number.isFinite(nextTotal) && nextTotal >= 0 ? nextTotal : 0);

      if (selectedTaskId && !items.some((x: Task) => x.id === selectedTaskId)) {
        setSelectedTaskId(null);
      }
    } catch (err: any) {
      setTasks([]);
      setTotalPages(1);
      setTotal(0);
      setMsg(err?.response?.data?.message || "Failed to load tasks");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadTasks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab]);

  useEffect(() => {
    setPage(1);
    loadTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterUser]);

  useEffect(() => {
    if (activeTab === "project" && projectTasks.length === 0 && personalTasks.length > 0) {
      setActiveTab("personal");
    }
    if (activeTab === "personal" && personalTasks.length === 0 && projectTasks.length > 0) {
      setActiveTab("project");
    }
  }, [activeTab, projectTasks.length, personalTasks.length]);

  const deleteTask = async (id: number) => {
    const ok = window.confirm("Delete this task?");
    if (!ok) return;

    setBusy(true);
    setMsg("");
    try {
      const res = await api.delete(`/tasks/${id}/`);
      setMsg(res.data?.message || "Deleted ✅");

      if (selectedTaskId === id) setSelectedTaskId(null);

      const nextPage = page > 1 && tasks.length === 1 ? page - 1 : page;
      setPage(nextPage);
      await loadTasks(nextPage);
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Delete failed ❌");
    } finally {
      setBusy(false);
    }
  };

  const renderTaskRow = (t: Task) => {
    const u = userMap.get(Number(t.assigned_to || 0));
    const pill = statusBadge(t.status);
    const active = selectedTaskId === t.id;

    return (
      <div
        key={t.id}
        role="button"
        tabIndex={0}
        className={`tmRow ${active ? "active" : ""}`}
        onClick={() => setSelectedTaskId(t.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setSelectedTaskId(t.id);
          }
        }}
        title="Click to open details"
      >
        <div className="tmCell">
          <div className="tmTaskTitle">
            {t.title} <span className="tmTaskId">#{t.id}</span>
          </div>
          <div className="tmTaskSub">{t.description || "No description"}</div>
        </div>

        <div className="tmCell">
          <div className="tmAssignedName">
            {u?.name || `User #${t.assigned_to}`}
          </div>
          <div className="tmTaskSub">{u?.email || "—"}</div>
        </div>

        <div className="tmCell">
          <span className={`tmBadge ${pill.cls}`}>{pill.label}</span>
        </div>

        <div className="tmCell">
          <div className="tmDueText">{prettyDue(t.due_date || "")}</div>
        </div>

        <div
          className="tmActions"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="tmMiniBtn"
            onClick={() => setEditId(t.id)}
            disabled={busy}
          >
            Edit
          </button>
          <button
            type="button"
            className="tmMiniBtn danger"
            onClick={() => deleteTask(t.id)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderProjectTab = () => {
    if (busy && tasks.length === 0) {
      return <div className="tmEmpty">Loading tasks...</div>;
    }

    if (projectTasks.length === 0) {
      return <div className="tmEmpty">No project tasks found.</div>;
    }

    return (
      <div className="tmProjectGroupsWrap">
        {groupedProjectTasks.map((group) => {
          const doneCount = group.tasks.filter((t) => t.status === "DONE").length;

          return (
            <div key={group.key} className="tmGroupCard">
              <div className="tmGroupCardHeader">
                <div className="tmProjectLeft">
                  <div className="tmProjectIcon">
                    <FiFolder />
                  </div>

                  <div className="tmProjectTextWrap">
                    <div className="tmProjectTitleRow">
                      <div className="tmProjectTitle">{group.projectName}</div>
                      <span className="tmProjectId">#{group.projectId}</span>
                    </div>
                    <div className="tmProjectMeta">Project-linked tasks</div>
                  </div>
                </div>

                <div className="tmProjectGroupStats">
                  <span className="tmProjectChip">
                    {group.tasks.length} Task{group.tasks.length === 1 ? "" : "s"}
                  </span>
                  <span className="tmProjectChip subtle">{doneCount} Done</span>
                </div>
              </div>

              <div className="tmListTopHeader">
                <span>TASK</span>
                <span>ASSIGNED</span>
                <span>STATUS</span>
                <span>DUE</span>
                <span className="tmHeaderActions">ACTIONS</span>
              </div>

              <div className="tmGroupRows">{group.tasks.map(renderTaskRow)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPersonalTab = () => {
    if (busy && tasks.length === 0) {
      return <div className="tmEmpty">Loading tasks...</div>;
    }

    if (personalTasks.length === 0) {
      return <div className="tmEmpty">No personal tasks found.</div>;
    }

    return (
      <div className="tmPersonalWrap">
        <div className="tmGroupCard personalCard">
          <div className="tmGroupCardHeader personalHeader">
            <div className="tmProjectLeft">
              <div className="tmProjectIcon personalIcon">
                <FiCheckSquare />
              </div>

              <div className="tmProjectTextWrap">
                <div className="tmProjectTitle">Personal Tasks</div>
                <div className="tmProjectMeta">
                  Standalone tasks without project mapping
                </div>
              </div>
            </div>

            <div className="tmProjectGroupStats">
              <span className="tmProjectChip personalChip">
                {personalTasks.length} Task{personalTasks.length === 1 ? "" : "s"}
              </span>
              <span className="tmProjectChip subtle">
                {personalTasks.filter((t) => t.status === "DONE").length} Done
              </span>
            </div>
          </div>

          <div className="tmListTopHeader">
            <span>TASK</span>
            <span>ASSIGNED</span>
            <span>STATUS</span>
            <span>DUE</span>
            <span className="tmHeaderActions">ACTIONS</span>
          </div>

          <div className="tmGroupRows">{personalTasks.map(renderTaskRow)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="tm">
      <div className="tmHead">
        <div className="tmTitleBlock">
          <div className="tmEyebrow">Workspace</div>
          <h3 className="tmPageTitle">Task Management</h3>
          <p className="tmPageSub">
            Manage project tasks and personal tasks in one place.
          </p>
        </div>

        <div className="tmControls">
          <input
            className="tmInput"
            placeholder="Search title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="tmInput tmSelect"
            value={filterUser === "" ? "" : String(filterUser)}
            onChange={(e) => {
              const v = e.target.value;
              setFilterUser(v === "" ? "" : Number(v));
            }}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <button className="tmBtn" onClick={() => loadTasks(page)} disabled={busy}>
            {busy ? "Loading..." : "Refresh"}
          </button>

          {(selectedTaskId || search || filterUser !== "") && (
            <button
              className="tmBtn tmBtnGhost"
              onClick={() => {
                setSelectedTaskId(null);
                setSearch("");
                setFilterUser("");
                setPage(1);
              }}
              disabled={busy}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {msg ? <div className="tmAlert">{msg}</div> : null}

      <div className="tmSectionCard">
        <div className="tmTabsWrap">
          <div className="tmTabs">
            <button
              type="button"
              className={`tmTabBtn ${activeTab === "project" ? "active" : ""}`}
              onClick={() => setActiveTab("project")}
            >
              <FiFolder className="tmTabIcon" />
              <span>Project Tasks</span>
            </button>

            <button
              type="button"
              className={`tmTabBtn ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <FiCheckSquare className="tmTabIcon" />
              <span>Personal Tasks</span>
            </button>
          </div>
        </div>

        <div className="tmTabPanelHead">
          <div>
            <h3 className="tmSectionPageTitle">
              {activeTab === "project" ? "Project Tasks" : "Personal Tasks"}
            </h3>
            <p className="tmSectionPageSub">
              {activeTab === "project"
                ? "View all tasks linked with projects."
                : "View all standalone personal tasks."}
            </p>
          </div>

          <div className="tmSectionCountBadge">
            {activeTab === "project"
              ? `${projectTasks.length} Task${projectTasks.length === 1 ? "" : "s"}`
              : `${personalTasks.length} Task${personalTasks.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="tmTabPanel">
          {activeTab === "project" ? renderProjectTab() : renderPersonalTab()}
        </div>
      </div>

      {selectedTask && (
        <div
          className="tmModalOverlay"
          onClick={() => setSelectedTaskId(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-details-title"
        >
          <div
            className="tmModalCard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tmSectionTop detailsTop tmModalHeader">
              <div>
                <h3
                  id="task-details-title"
                  className="tmSectionPageTitle tmDetailsTitle"
                >
                  <FiClipboard className="tmDetailsTitleIcon" />
                  <span>
                    Task Details: {selectedTask.title}{" "}
                    <span className="tmTaskId">#{selectedTask.id}</span>
                  </span>
                </h3>
                <p className="tmSectionPageSub">
                  Attachments and comments for the selected task
                </p>
              </div>

              <button
                className="tmBtn tmBtnGhost"
                onClick={() => setSelectedTaskId(null)}
                disabled={busy}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="tmDetailsFull tmModalBody">
              <div className="tmDetailMeta">
                <span>
                  Due: <b>{prettyDue(selectedTask.due_date || "")}</b>
                </span>
                <span>•</span>
                <span>
                  Status: <b>{selectedTask.status}</b>
                </span>
                <span>•</span>
                <span>
                  Project: <b>{selectedTask.project_name || "Personal Task"}</b>
                  {selectedTask.project_id ? ` (#${selectedTask.project_id})` : ""}
                </span>
              </div>

              <div className="tmDetailSection">
                <div className="tmSectionHead">
                  <FiPaperclip />
                  <span>Attachments</span>
                </div>
                <DashboardAttachments taskId={selectedTask.id} />
              </div>

              <div className="tmDetailSection">
                <div className="tmSectionHead">
                  <FiCheckSquare />
                  <span>Comments</span>
                </div>
                <DashboardComments taskId={selectedTask.id} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pg">
        <button
          className="pgBtn"
          disabled={page <= 1 || busy}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>

        <span className="pgInfo">
          Page <b>{page}</b> / <b>{totalPages}</b>
        </span>

        <button
          className="pgBtn"
          disabled={page >= totalPages || busy}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      <EditTaskModal
        open={!!editId}
        taskId={editId}
        users={users}
        onClose={() => setEditId(null)}
        onSaved={() => loadTasks(page)}
      />
    </div>
  );
}