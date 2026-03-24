import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../auth/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiLayers,
  FiList,
  FiUsers,
  FiArrowLeft,
} from "react-icons/fi";
import { api } from "../../api/api";
import "../../css/userProjectDetails.css";

type UserProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  total_tasks: number;
  completed_tasks: number;
  member_count: number;
  progress: number;
};

type ProjectTask = {
  id: number;
  title: string;
  description: string | null;
  status: string ;
  due_date: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
};

type ProjectMember = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
};

type ProjectActivity = {
  id: number;
  action: string;
  message: string;
  created_at: string;
};

function toArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function formatStatus(status?: string | null) {
  return (status || "PENDING").replace(/_/g, " ");
}

function getStatusClass(status?: string | null) {
  const s = (status || "PENDING").toUpperCase();

  if (s === "DONE" || s === "COMPLETED") return "done";
  if (s === "IN_PROGRESS") return "inprogress";
  if (s === "ON_HOLD") return "hold";
  return "pending";
}

function formatDate(date?: string | null) {
  if (!date) return "No deadline";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const currentUserId = auth?.user?.id ?? null;

  const [taskView, setTaskView] = useState<"mine" | "team">("mine");
  const [project, setProject] = useState<UserProjectDetail | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activity, setActivity] = useState<ProjectActivity[]>([]);
  const [tab, setTab] = useState<"overview" | "tasks" | "members" | "activity">("overview");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigned_to === currentUserId),
    [tasks, currentUserId]
  );

  const teamTasks = useMemo(
    () => tasks.filter((t) => t.assigned_to !== currentUserId),
    [tasks, currentUserId]
  );

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (t) => !["DONE", "COMPLETED"].includes((t.status || "").toUpperCase())
      ).length,
    [tasks]
  );

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setMsg("");

      const [p, t, m, a] = await Promise.all([
        api.get(`/user/projects/${projectId}/`),
        api.get(`/user/projects/${projectId}/tasks/`),
        api.get(`/user/projects/${projectId}/members/`),
        api.get(`/user/projects/${projectId}/activity/`),
      ]);

      setProject(p.data?.project || null);
      setTasks(toArray(t.data?.tasks));
      setMembers(toArray(m.data?.members));
      setActivity(toArray(a.data?.activity));
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to load project details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateMyTaskStatus(taskId: number, status: string) {
    try {
      await api.patch(`/tasks/${taskId}/status/`, { status });

      setTasks((prev) => {
        const updatedTasks = prev.map((task) =>
          task.id === taskId ? { ...task, status } : task
        );

        setProject((prevProject) => {
          if (!prevProject) return prevProject;

          const completed = updatedTasks.filter((task) =>
            ["DONE", "COMPLETED"].includes((task.status || "").toUpperCase())
          ).length;

          const total = updatedTasks.length;
          const progress = total ? Math.round((completed / total) * 100) : 0;

          return {
            ...prevProject,
            completed_tasks: completed,
            total_tasks: total,
            progress,
          };
        });

        return updatedTasks;
      });
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update task status."
      );
    }
  }

  if (loading) {
    return (
      <div className="userProjectDetailsPage">
        <div className="userProjectDetailsSkeleton hero" />
        <div className="userProjectDetailsStatsGrid">
          <div className="userProjectDetailsSkeleton stat" />
          <div className="userProjectDetailsSkeleton stat" />
          <div className="userProjectDetailsSkeleton stat" />
          <div className="userProjectDetailsSkeleton stat" />
        </div>
        <div className="userProjectDetailsSkeleton section" />
      </div>
    );
  }

  if (msg) {
    return (
      <div className="userProjectDetailsPage">
        <div className="userProjectDetailsAlert">{msg}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="userProjectDetailsPage">
        <div className="userProjectDetailsEmpty">
          <div className="userProjectDetailsEmptyIcon">
            <FiFolder />
          </div>
          <h3>Project not found</h3>
          <p>We could not load the requested project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="userProjectDetailsPage">
      <div className="userProjectTopBar premium">
        <button className="backBtn premiumBackBtn" onClick={() => navigate("/user/projects")}>
          <FiArrowLeft />
          <span>Back to Projects</span>
        </button>

        <div className="breadcrumbCard">
          <span
            className="breadcrumbLink"
            onClick={() => navigate("/user/projects")}
          >
            <FiFolder />
            <span>Projects</span>
          </span>

          <span className="breadcrumbSeparator">/</span>

          <strong className="breadcrumbCurrent">{project.name}</strong>
        </div>
      </div>

      <div className="userProjectHero">
        <div className="userProjectHeroTop">
          <div className="userProjectHeroText">
            <p className="userProjectEyebrow">Project Workspace</p>
            <h1>{project.name}</h1>
            <p className="userProjectHeroDesc">
              {project.description || "No description added for this project yet."}
            </p>
          </div>

          <span className={`userProjectStatusBadge ${getStatusClass(project.status)}`}>
            {formatStatus(project.status)}
          </span>
        </div>

        <div className="userProjectHeroBottom">
          <div className="userProjectProgressBlock">
            <div className="userProjectProgressHead">
              <span>Overall progress</span>
              <strong>{project.progress}%</strong>
            </div>
            <div className="userProjectProgressTrack">
              <div
                className="userProjectProgressFill"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="userProjectMiniMeta">
            <span>
              <FiCalendar /> {formatDate(project.due_date)}
            </span>
            <span>
              <FiUsers /> {project.member_count} members
            </span>
            <span>
              <FiList /> {project.total_tasks} tasks
            </span>
          </div>
        </div>
      </div>

      <div className="userProjectDetailsStatsGrid">
        <div className="userProjectStatCard">
          <div className="userProjectStatIcon">
            <FiLayers />
          </div>
          <div>
            <p>Total Tasks</p>
            <h3>{project.total_tasks}</h3>
          </div>
        </div>

        <div className="userProjectStatCard">
          <div className="userProjectStatIcon">
            <FiCheckCircle />
          </div>
          <div>
            <p>Completed</p>
            <h3>{project.completed_tasks}</h3>
          </div>
        </div>

        <div className="userProjectStatCard">
          <div className="userProjectStatIcon">
            <FiClock />
          </div>
          <div>
            <p>Pending</p>
            <h3>{pendingTasks}</h3>
          </div>
        </div>

        <div className="userProjectStatCard">
          <div className="userProjectStatIcon">
            <FiBarChart2 />
          </div>
          <div>
            <p>Progress</p>
            <h3>{project.progress}%</h3>
          </div>
        </div>
      </div>

      <div className="userProjectTabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={tab === "tasks" ? "active" : ""}
          onClick={() => setTab("tasks")}
        >
          Tasks
        </button>
        <button
          className={tab === "members" ? "active" : ""}
          onClick={() => setTab("members")}
        >
          Members
        </button>
        <button
          className={tab === "activity" ? "active" : ""}
          onClick={() => setTab("activity")}
        >
          Activity
        </button>
      </div>

      {tab === "overview" && (
        <div className="userProjectOverviewGrid">
          <div className="userProjectPanel">
            <div className="userProjectPanelHead">
              <h3>Project Summary</h3>
            </div>

            <div className="userProjectSummaryList">
              <div className="userProjectSummaryRow">
                <span>Status</span>
                <strong>{formatStatus(project.status)}</strong>
              </div>
              <div className="userProjectSummaryRow">
                <span>Deadline</span>
                <strong>{formatDate(project.due_date)}</strong>
              </div>
              <div className="userProjectSummaryRow">
                <span>Total Tasks</span>
                <strong>{project.total_tasks}</strong>
              </div>
              <div className="userProjectSummaryRow">
                <span>Completed Tasks</span>
                <strong>{project.completed_tasks}</strong>
              </div>
              <div className="userProjectSummaryRow">
                <span>Members</span>
                <strong>{project.member_count}</strong>
              </div>
            </div>
          </div>

          <div className="userProjectPanel">
            <div className="userProjectPanelHead">
              <h3>Recent Activity</h3>
            </div>

            {activity.length === 0 ? (
              <div className="userProjectEmptyInline">No activity available.</div>
            ) : (
              <div className="userProjectTimeline">
                {activity.slice(0, 5).map((a) => (
                  <div key={a.id} className="userProjectTimelineItem">
                    <div className="userProjectTimelineDot" />
                    <div className="userProjectTimelineContent">
                      <p>{a.message}</p>
                      <span>{formatDateTime(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="userProjectPanel">
          <div className="userProjectPanelHead">
            <h3>Project Tasks</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="userProjectEmptyInline">No tasks added to this project.</div>
          ) : (
            <div className="projectTaskSwitcherWrap">
              <div className="projectTaskSwitcher">
                <button
                  type="button"
                  className={taskView === "mine" ? "active" : ""}
                  onClick={() => setTaskView("mine")}
                >
                  My Tasks
                  <span>{myTasks.length}</span>
                </button>

                <button
                  type="button"
                  className={taskView === "team" ? "active" : ""}
                  onClick={() => setTaskView("team")}
                >
                  Team Tasks
                  <span>{teamTasks.length}</span>
                </button>
              </div>

              {taskView === "mine" ? (
                myTasks.length === 0 ? (
                  <div className="userProjectEmptyInline">
                    No tasks are assigned to you in this project.
                  </div>
                ) : (
                  <div className="userProjectCardList">
                    {myTasks.map((t) => (
                      <div key={t.id} className="userProjectInfoCard">
                        <div className="userProjectInfoCardTop">
                          <div>
                            <h4>{t.title}</h4>
                            <p>{t.description || "No description available."}</p>
                          </div>

                          <span
                            className={`userProjectStatusBadge ${getStatusClass(t.status)}`}
                          >
                            {formatStatus(t.status)}
                          </span>
                        </div>

                        <div className="userProjectInfoMeta">
                          <span>
                            <FiCalendar /> {formatDate(t.due_date)}
                          </span>
                          <span>
                            <FiUsers /> Assigned to: {t.assigned_to_name || "You"}
                          </span>
                        </div>

                        <div className="taskOwnershipRow">
                          <span className="taskOwnershipTag mine">Editable by you</span>

                          <select
                            className="taskStatusSelect"
                            value={t.status}
                            onChange={(e) => updateMyTaskStatus(t.id, e.target.value)}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : teamTasks.length === 0 ? (
                <div className="userProjectEmptyInline">No team tasks available.</div>
              ) : (
                <div className="userProjectCardList">
                  {teamTasks.map((t) => (
                    <div key={t.id} className="userProjectInfoCard">
                      <div className="userProjectInfoCardTop">
                        <div>
                          <h4>{t.title}</h4>
                          <p>{t.description || "No description available."}</p>
                        </div>

                        <span
                          className={`userProjectStatusBadge ${getStatusClass(t.status)}`}
                        >
                          {formatStatus(t.status)}
                        </span>
                      </div>

                      <div className="userProjectInfoMeta">
                        <span>
                          <FiCalendar /> {formatDate(t.due_date)}
                        </span>
                        <span>
                          <FiUsers /> Assigned to: {t.assigned_to_name || "Unassigned"}
                        </span>
                      </div>

                      <div className="taskOwnershipRow">
                        <span className="taskOwnershipTag locked">View only</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="userProjectPanel">
          <div className="userProjectPanelHead">
            <h3>Project Members</h3>
          </div>

          {members.length === 0 ? (
            <div className="userProjectEmptyInline">No members found.</div>
          ) : (
            <div className="userProjectCardList">
              {members.map((m) => (
                <div key={m.user_id} className="userProjectInfoCard memberCard">
                  <div className="memberAvatar">
                    {(m.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="memberDetails">
                    <h4>{m.full_name}</h4>
                    <p>{m.email}</p>
                  </div>
                  <span className="memberRole">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="userProjectPanel">
          <div className="userProjectPanelHead">
            <h3>Project Activity</h3>
          </div>

          {activity.length === 0 ? (
            <div className="userProjectEmptyInline">No activity found.</div>
          ) : (
            <div className="userProjectCardList">
              {activity.map((a) => (
                <div key={a.id} className="userProjectInfoCard">
                  <div className="activityCardTop">
                    <h4>{a.action}</h4>
                    <span>{formatDateTime(a.created_at)}</span>
                  </div>
                  <p>{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}