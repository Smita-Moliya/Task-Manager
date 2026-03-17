import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCalendar, FiCheckSquare, FiClipboard, FiFileText, FiUser } from "react-icons/fi";
import { api } from "../../api/api";

type MemberRow = {
  user_id: number;
  name: string;
  email: string;
  member_role: string;
};

export default function AssignProjectTaskPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | "">("");

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    async function loadMembers() {
      setLoadingMembers(true);
      setMsg("");

      try {
        const res = await api.get(`/projects/${projectId}/members/`);
        setMembers(res.data?.members || []);
      } catch (err: any) {
        setMembers([]);
        setMsg("Could not load project members");
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, [projectId]);

  const selectedMember = useMemo(
    () => members.find((m) => m.user_id === assignedTo),
    [members, assignedTo]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setMsg("Title is required");
      return;
    }

    if (!assignedTo) {
      setMsg("Please select a project member");
      return;
    }

    setBusy(true);
    setMsg("");

    try {
      await api.post("/tasks/create/", {
        title: title.trim(),
        description: description.trim() || null,
        status,
        due_date: dueDate || null,
        assigned_to: assignedTo,
        project_id: Number(projectId),
      });

      navigate(`/admin/projects/${projectId}`);
    } catch (err: any) {
      const data = err?.response?.data;

      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        setMsg(String(firstError || "Could not create task"));
      } else {
        setMsg(data?.message || "Could not create task");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adminPage">
      <div className="assignTaskPage">
        <div className="assignTaskTopBar">
          <button
            type="button"
            className="projectCancelBtn assignTaskBackBtn"
            onClick={() => navigate(`/admin/projects/${projectId}`)}
          >
            <FiArrowLeft />
            Back to Project
          </button>
        </div>

        <form onSubmit={handleSubmit} className="projectForm uiCardBody">
          <div className="projectFormHeader">
            <div className="projectFormHeaderText">
              <div className="projectFormEyebrow">Project Task</div>
              <h2 className="projectFormTitle">Assign Task to Project Member</h2>
              <p className="projectFormSubtitle">
                Create a new task, define its status and deadline, and assign it to an active
                member of this project.
              </p>
            </div>

            <div className="projectFormHeaderBadge">
              {loadingMembers ? "Loading members..." : `${members.length} member${members.length === 1 ? "" : "s"} available`}
            </div>
          </div>

          {msg ? (
            <div className={`uiAlert ${msg.toLowerCase().includes("could not") || msg.toLowerCase().includes("required") || msg.toLowerCase().includes("please") ? "uiAlertError" : "uiAlertInfo"} assignTaskAlert`}>
              {msg}
            </div>
          ) : null}

          {!loadingMembers && members.length === 0 ? (
            <div className="assignTaskEmptyState">
              <div className="assignTaskEmptyIcon">
                <FiUser />
              </div>
              <div className="assignTaskEmptyTitle">No project members available</div>
              <div className="assignTaskEmptySub">
                Add members to this project first, then you will be able to assign tasks to them.
              </div>
            </div>
          ) : null}

          <div className="assignTaskLayout">
            <div className="assignTaskMain">
              <div className="projectFormGrid">
                <div className="formField">
                  <label htmlFor="task-title">Title</label>
                  <div className="inputWithIcon">
                    <span className="inputIcon">
                      <FiClipboard />
                    </span>
                    <input
                      id="task-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter task title"
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="formField">
                  <label htmlFor="task-status">Status</label>
                  <div className="inputWithIcon">
                    <span className="inputIcon">
                      <FiCheckSquare />
                    </span>
                    <select
                      id="task-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={busy}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                <div className="formField formFieldFull">
                  <label htmlFor="task-description">Description</label>
                  <div className="inputWithIcon textareaWithIcon">
                    <span className="inputIcon inputIconTop">
                      <FiFileText />
                    </span>
                    <textarea
                      id="task-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Add task details, expectations, or notes"
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="formField">
                  <label htmlFor="task-due-date">Due Date</label>
                  <div className="inputWithIcon">
                    <span className="inputIcon">
                      <FiCalendar />
                    </span>
                    <input
                      id="task-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="formField">
                  <label htmlFor="task-assigned-to">Assign To</label>
                  <div className="inputWithIcon">
                    <span className="inputIcon">
                      <FiUser />
                    </span>
                    <select
                      id="task-assigned-to"
                      value={assignedTo}
                      onChange={(e) =>
                        setAssignedTo(e.target.value ? Number(e.target.value) : "")
                      }
                      disabled={busy || members.length === 0}
                    >
                      <option value="">
                        {members.length === 0 ? "No members available" : "Select member"}
                      </option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name} ({m.member_role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <aside className="assignTaskSideCard">
              <div className="assignTaskSideTitle">Task Preview</div>
              <div className="assignTaskSideSub">
                Review the assignment details before creating the task.
              </div>

              <div className="assignTaskPreviewList">
                <div className="assignTaskPreviewItem">
                  <span className="assignTaskPreviewLabel">Title</span>
                  <strong>{title.trim() || "Not entered yet"}</strong>
                </div>

                <div className="assignTaskPreviewItem">
                  <span className="assignTaskPreviewLabel">Status</span>
                  <span className={`assignTaskStatusChip assignTaskStatusChip--${status.toLowerCase()}`}>
                    {status === "IN_PROGRESS" ? "In Progress" : status === "DONE" ? "Done" : "Pending"}
                  </span>
                </div>

                <div className="assignTaskPreviewItem">
                  <span className="assignTaskPreviewLabel">Due Date</span>
                  <strong>{dueDate || "Not selected"}</strong>
                </div>

                <div className="assignTaskPreviewItem">
                  <span className="assignTaskPreviewLabel">Assigned Member</span>
                  <strong>{selectedMember ? selectedMember.name : "Not selected"}</strong>
                  {selectedMember ? (
                    <span className="assignTaskMemberMeta">
                      {selectedMember.email} • {selectedMember.member_role}
                    </span>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>

          <div className="projectFormFooter">
            <div className="projectFormHint">
              Make sure the right project member is selected before creating the task.
            </div>

            <div className="projectFormActions assignTaskActions">
              <button
                type="button"
                className="projectCancelBtn"
                onClick={() => navigate(`/admin/projects/${projectId}`)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="uiButton uiButtonPrimary projectSubmitBtn"
                disabled={busy || members.length === 0}
              >
                {busy ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}