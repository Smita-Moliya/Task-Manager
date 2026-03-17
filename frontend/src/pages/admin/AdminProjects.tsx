import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiArrowRight,
  FiTarget,
} from "react-icons/fi";
import { createProject, deleteProject, getProjects } from "../../api/projects";
import ProjectForm from "../../components/projects/ProjectForm";
import { ProjectPayload, ProjectRow } from "../../types/project";
import "../../css/projects.css";

function progressPercent(project: ProjectRow) {
  const total = Number(project.task_count || 0);
  const completed = Number(project.completed_count || 0);
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function getStatusClass(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "projectBadge statusActive";
    case "COMPLETED":
      return "projectBadge statusCompleted";
    case "ON_HOLD":
      return "projectBadge statusOnHold";
    case "CANCELLED":
      return "projectBadge statusCancelled";
    default:
      return "projectBadge";
  }
}

function getPriorityClass(priority?: string) {
  switch ((priority || "").toUpperCase()) {
    case "HIGH":
      return "projectBadge priorityHigh";
    case "MEDIUM":
      return "projectBadge priorityMedium";
    case "LOW":
      return "projectBadge priorityLow";
    default:
      return "projectBadge";
  }
}

export default function AdminProjects() {
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");

    const res = await getProjects({ q, status });

    if (res.ok) {
      setItems(res.data.projects || []);
    } else {
      setItems([]);
      setMsg(res.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload: ProjectPayload) {
    setSubmitting(true);
    setMsg("");

    const res = await createProject(payload);
    setSubmitting(false);

    if (!res.ok) {
      setMsg(res.errors?.name || res.message);
      return;
    }

    setMsg(res.data.message);
    setShowForm(false);
    load();
  }

  async function handleDelete(projectId: number) {
    const ok = window.confirm("Delete this project?");
    if (!ok) return;

    const res = await deleteProject(projectId);
    if (!res.ok) {
      setMsg(res.message);
      return;
    }

    setMsg(res.data.message);
    load();
  }

  function closeForm() {
    if (submitting) return;
    setShowForm(false);
  }

  const stats = useMemo(() => {
    const totalProjects = items.length;
    const activeProjects = items.filter((p) => p.status === "ACTIVE").length;
    const completedProjects = items.filter(
      (p) => p.status === "COMPLETED"
    ).length;
    const totalMembers = items.reduce(
      (sum, p) => sum + Number(p.member_count || 0),
      0
    );
    const totalTasks = items.reduce(
      (sum, p) => sum + Number(p.task_count || 0),
      0
    );
    const totalCompletedTasks = items.reduce(
      (sum, p) => sum + Number(p.completed_count || 0),
      0
    );

    const overallProgress =
      totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalMembers,
      overallProgress,
    };
  }, [items]);

  return (
    <div className="adminPage saasProjectsPage">
      <div className="projectTopBar">
        <button
          className="uiButton uiButtonPrimary premiumAddButton"
          onClick={() => setShowForm(true)}
        >
          + New Project
        </button>
      </div>

      {msg ? <div className="uiAlert uiAlertInfo">{msg}</div> : null}

      <section className="statsGrid">
        <div className="statCard statCardGradientPurple">
          <div className="statIcon">
            <FiBriefcase />
          </div>
          <div>
            <div className="statLabel">Total Projects</div>
            <div className="statValue">{stats.totalProjects}</div>
          </div>
        </div>

        <div className="statCard statCardGradientBlue">
          <div className="statIcon">
            <FiClock />
          </div>
          <div>
            <div className="statLabel">Active Projects</div>
            <div className="statValue">{stats.activeProjects}</div>
          </div>
        </div>

        <div className="statCard statCardGradientGreen">
          <div className="statIcon">
            <FiCheckCircle />
          </div>
          <div>
            <div className="statLabel">Completed</div>
            <div className="statValue">{stats.completedProjects}</div>
          </div>
        </div>

        <div className="statCard statCardGradientOrange">
          <div className="statIcon">
            <FiUsers />
          </div>
          <div>
            <div className="statLabel">Team Members</div>
            <div className="statValue">{stats.totalMembers}</div>
          </div>
        </div>

        <div className="statCard statCardWide">
          <div className="statWideTop">
            <div className="statWideLeft">
              <div className="statIcon subtle">
                <FiTarget />
              </div>
              <div>
                <div className="statLabel">Overall Progress</div>
                <div className="statValue">{stats.overallProgress}%</div>
              </div>
            </div>
            <div className="statTrend">+ better visibility</div>
          </div>

          <div className="overallProgressBar">
            <div
              className="overallProgressFill"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </section>

      {showForm ? (
        <div className="projectModalOverlay" onClick={closeForm}>
          <div
            className="projectModalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectForm
              onSubmit={handleCreate}
              onCancel={closeForm}
              submitting={submitting}
              submitLabel="Create Project"
            />
          </div>
        </div>
      ) : null}

      <section className="uiCard uiCardBody premiumFiltersCard">
        <div className="premiumFilterInput premiumSearchInput">
          <FiSearch className="premiumInputIcon" />
          <input
            placeholder="Search by project name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="premiumFilterSelect">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <button
          className="uiButton uiButtonPrimary premiumApplyButton"
          onClick={load}
        >
          Apply Filters
        </button>
      </section>

      {loading ? (
        <div className="premiumStateCard">
          <div className="premiumStateTitle">Loading projects...</div>
          <div className="premiumStateSub">Preparing your project dashboard.</div>
        </div>
      ) : items.length === 0 ? (
        <div className="premiumStateCard">
          <div className="premiumStateTitle">No projects found</div>
          <div className="premiumStateSub">
            Try changing filters or create a new project to get started.
          </div>
        </div>
      ) : (
        <section className="premiumProjectGrid">
          {items.map((p) => {
            const progress = progressPercent(p);

            return (
              <article key={p.id} className="premiumProjectCard">
                <div className="premiumProjectGlow" />

                <div className="premiumProjectTop">
                  <div className="premiumProjectTitleWrap">
                    <div className="premiumProjectIcon">
                      <FiBriefcase />
                    </div>
                    <div>
                      <div className="premiumProjectTitle">{p.name}</div>
                      <div className="premiumProjectSub">
                        {p.description || "No description available for this project."}
                      </div>
                    </div>
                  </div>

                  <div className="premiumProjectBadges">
                    <span className={getStatusClass(p.status)}>{p.status}</span>
                    <span className={getPriorityClass(p.priority)}>
                      {p.priority}
                    </span>
                  </div>
                </div>

                <div className="premiumMiniStats">
                  <div className="premiumMiniStatBox">
                    <span className="miniStatLabel">Members</span>
                    <strong>{p.member_count || 0}</strong>
                  </div>
                  <div className="premiumMiniStatBox">
                    <span className="miniStatLabel">Tasks</span>
                    <strong>{p.task_count || 0}</strong>
                  </div>
                  <div className="premiumMiniStatBox">
                    <span className="miniStatLabel">Completed</span>
                    <strong>{p.completed_count || 0}</strong>
                  </div>
                </div>

                <div className="premiumProgressSection">
                  <div className="premiumProgressHead">
                    <span>Project Completion</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="premiumProgressBar">
                    <div
                      className="premiumProgressFill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="premiumDatesRow">
                  <div className="premiumDateBlock">
                    <span className="premiumDateLabel">Start Date</span>
                    <span className="premiumDateValue">{p.start_date || "—"}</span>
                  </div>
                  <div className="premiumArrowWrap">
                    <FiArrowRight />
                  </div>
                  <div className="premiumDateBlock">
                    <span className="premiumDateLabel">End Date</span>
                    <span className="premiumDateValue">{p.end_date || "—"}</span>
                  </div>
                </div>

                <div className="premiumProjectActions">
                  <a
                    className="uiButton uiButtonSm premiumViewButton"
                    href={`/admin/projects/${p.id}`}
                  >
                    View Details
                  </a>

                  <button
                    className="uiButton uiButtonSm premiumDeleteButton"
                    onClick={() => handleDelete(p.id)}
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}