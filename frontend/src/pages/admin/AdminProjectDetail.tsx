import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiLayers,
  FiUsers,
  FiCheckSquare,
} from "react-icons/fi";
import { getProject } from "../../api/projects";
import { getProjectMembers } from "../../api/projectMembers";
import { api } from "../../api/api";
import AddProjectMembersBox from "../../components/projects/AddProjectMembersBox";
import ProjectMembersCard from "../../components/projects/ProjectMembersCard";
import ProjectTasksSection from "../../components/projects/ProjectTasksSection";

import {
  ProjectMemberRow,
  ProjectRow,
  ProjectSummary,
} from "../../types/project";
import "../../css/projects.css";

type UserOption = {
  id: number;
  name: string;
  email: string;
};

type TaskRow = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  assigned_to_name?: string | null;
};

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

export default function AdminProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);

  const [project, setProject] = useState<ProjectRow | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [projectTasks, setProjectTasks] = useState<TaskRow[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"team" | "tasks">("team");

  async function loadProject() {
    const res = await getProject(projectId);
    if (!res.ok) {
      setMsg(res.message);
      return;
    }
    setProject(res.data.project);
    setSummary(res.data.summary);
  }

  async function loadMembers() {
    const res = await getProjectMembers(projectId);
    if (!res.ok) {
      setMsg(res.message);
      return;
    }
    setMembers(res.data.members);
  }

  async function loadUsers() {
    try {
      const res = await api.get("/users/", {
        params: { page: 1, page_size: 500 },
      });

      const rows = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.users)
        ? res.data.users
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

      setAllUsers(
        rows.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        }))
      );
    } catch (err: any) {
      console.error("LOAD USERS ERROR:", err?.response?.data || err);
      setAllUsers([]);
    }
  }

  async function loadProjectTasks() {
    try {
      const res = await api.get("/tasks/", {
        params: { project_id: projectId },
      });

      const rows = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.tasks)
        ? res.data.tasks
        : Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

      const mapped: TaskRow[] = rows.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        due_date: task.due_date,
        assigned_to_name:
          task.assigned_to_name ||
          task.assignee_name ||
          task.assigned_user_name ||
          task.assigned_to?.name ||
          "-",
      }));

      setProjectTasks(mapped);
    } catch (err: any) {
      console.error("LOAD PROJECT TASKS ERROR:", err?.response?.data || err);
      setProjectTasks([]);
    }
  }

  async function reloadAll() {
    setLoading(true);
    setMsg("");
    await Promise.all([
      loadProject(),
      loadMembers(),
      loadUsers(),
      loadProjectTasks(),
    ]);
    setLoading(false);
  }

  useEffect(() => {
    if (!projectId) return;
    reloadAll();
  }, [projectId]);

  if (loading) {
    return (
      <div className="adminPage">
        <div className="detailStateCard">
          <div className="detailStateTitle">Loading project details...</div>
          <div className="detailStateSub">
            Fetching project summary, team members, and task information.
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="adminPage">
        <div className="detailStateCard">
          <div className="detailStateTitle">Project not found</div>
          <div className="detailStateSub">
            The project may have been removed or is unavailable.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminPage projectDetailPage">
      {msg ? <div className="uiAlert uiAlertInfo">{msg}</div> : null}

      <section className="projectDetailHero">
        <div className="projectDetailHeroLeft">
          <div className="projectDetailHeroIcon">
            <FiFolder />
          </div>

          <div className="projectDetailHeroContent">
            <div className="projectDetailEyebrow">Project Overview</div>
            <h2 className="projectDetailTitle">{project.name}</h2>
            <p className="projectDetailSub">
              {project.description || "No description available for this project."}
            </p>
          </div>
        </div>

        <div className="projectDetailHeroRight">
          <span className={getStatusClass(project.status)}>{project.status}</span>
          <span className={getPriorityClass(project.priority)}>
            {project.priority}
          </span>
        </div>
      </section>

      {summary ? (
        <section className="projectSummaryStats">
          <div className="projectSummaryStatCard">
            <div className="projectSummaryStatIcon statIconPurple">
              <FiUsers />
            </div>
            <div>
              <div className="projectSummaryStatLabel">Members</div>
              <div className="projectSummaryStatValue">{summary.member_count}</div>
            </div>
          </div>

          <div className="projectSummaryStatCard">
            <div className="projectSummaryStatIcon statIconBlue">
              <FiLayers />
            </div>
            <div>
              <div className="projectSummaryStatLabel">Total Tasks</div>
              <div className="projectSummaryStatValue">{summary.task_count}</div>
            </div>
          </div>

          <div className="projectSummaryStatCard">
            <div className="projectSummaryStatIcon statIconGreen">
              <FiCheckCircle />
            </div>
            <div>
              <div className="projectSummaryStatLabel">Completed</div>
              <div className="projectSummaryStatValue">
                {summary.completed_count}
              </div>
            </div>
          </div>

          <div className="projectSummaryStatCard">
            <div className="projectSummaryStatIcon statIconAmber">
              <FiClock />
            </div>
            <div>
              <div className="projectSummaryStatLabel">Pending</div>
              <div className="projectSummaryStatValue">{summary.pending_count}</div>
            </div>
          </div>

          <div className="projectSummaryStatCard">
            <div className="projectSummaryStatIcon statIconRed">
              <FiAlertCircle />
            </div>
            <div>
              <div className="projectSummaryStatLabel">Overdue</div>
              <div className="projectSummaryStatValue">{summary.overdue_count}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="projectWorkspaceCard">
        <div className="projectWorkspaceHeader">
          <div className="projectWorkspaceHeaderLeft">
            <div className="projectWorkspaceIcon">
              {activeTab === "team" ? <FiUsers /> : <FiCheckSquare />}
            </div>

            <div>
              <div className="projectWorkspaceEyebrow">Workspace</div>
              <h3 className="projectWorkspaceTitle">
                {activeTab === "team" ? "Team Management" : "Project Tasks"}
              </h3>
              <p className="projectWorkspaceSub">
                {activeTab === "team"
                  ? "Manage project members and roles in one place."
                  : "Review and manage all tasks linked to this project."}
              </p>
            </div>
          </div>

          <div className="projectWorkspaceMeta">
            <span className="projectWorkspacePill">
              {summary?.member_count || 0} Member
              {(summary?.member_count || 0) === 1 ? "" : "s"}
            </span>
            <span className="projectWorkspacePill subtle">
              {summary?.task_count || 0} Task
              {(summary?.task_count || 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="projectWorkspaceTabs">
          <button
            type="button"
            className={`projectWorkspaceTab ${
              activeTab === "team" ? "active" : ""
            }`}
            onClick={() => setActiveTab("team")}
          >
            <FiUsers />
            Team
          </button>

          <button
            type="button"
            className={`projectWorkspaceTab ${
              activeTab === "tasks" ? "active" : ""
            }`}
            onClick={() => setActiveTab("tasks")}
          >
            <FiCheckSquare />
            Tasks
          </button>
        </div>

        <div className="projectWorkspaceBody">
          {activeTab === "team" ? (
            <div className="projectWorkspacePanel">
              <div className="projectTopGrid">
                <div className="projectTopCol">
                  <AddProjectMembersBox
                    projectId={projectId}
                    allUsers={allUsers}
                    existingUserIds={members.map((m) => m.user_id)}
                    onDone={reloadAll}
                  />
                </div>

                <div className="projectTopCol">
                  <ProjectMembersCard
                    projectId={projectId}
                    members={members}
                    onReload={reloadAll}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="projectWorkspacePanel">
              <ProjectTasksSection
                projectId={projectId}
                totalTasks={summary?.task_count || 0}
                memberCount={summary?.member_count || 0}
                tasks={projectTasks}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}