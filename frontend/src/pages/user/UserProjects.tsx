import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiFolder,
  FiUsers,
  FiCheckCircle,
  FiCalendar,
} from "react-icons/fi";
import { api } from "../../api/api";
import "../../css/userProjects.css";
import UserPageHeader from "../../pages/user/UserPageHeader";
import ThemeToggle from "../../components/ThemeToggle";

type UserProject = {
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

function formatStatus(status: string) {
  return (status || "PENDING").replace(/_/g, " ");
}

function getStatusClass(status: string) {
  const s = (status || "").toUpperCase();

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

function normalizeProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function UserProjects() {
  const [items, setItems] = useState<UserProject[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setMsg("");

      const res = await api.get("/user/projects/");
      const projects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      setItems(projects);
    } catch (error: any) {
      setMsg(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to load projects."
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    if (!query) return items;

    return items.filter((project) => {
      const name = (project.name || "").toLowerCase();
      const description = (project.description || "").toLowerCase();

      return name.includes(query) || description.includes(query);
    });
  }, [items, q]);

  return (
    <div className="userProjectsPage">
      <UserPageHeader
        eyebrow="PROJECTS"
        title="Your Projects"
        subtitle="Monitor assigned projects, progress, deadlines, and team collaboration in one place."
        rightSlot={<ThemeToggle />}
      />

      <div className="userProjectsToolbar">
        <div className="userProjectsSearch">
          <FiSearch className="userProjectsSearchIcon" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="userProjectsCount">
          {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        </div>
      </div>

      {msg ? <div className="userProjectsAlert">{msg}</div> : null}

      {loading ? (
        <div className="userProjectsGrid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="userProjectCard userProjectCardSkeleton">
              <div className="userProjectCardTop">
                <div className="userProjectTitleWrap" style={{ width: "100%" }}>
                  <div className="skeleton skeletonTitle" />
                  <div style={{ height: 10 }} />
                  <div className="skeleton skeletonText" />
                  <div style={{ height: 8 }} />
                  <div className="skeleton skeletonText short" />
                </div>
              </div>

              <div className="skeleton skeletonBar" />

              <div className="userProjectStats">
                <div className="userProjectStat">
                  <span className="userProjectStatIcon" />
                  <div style={{ width: "100%" }}>
                    <div className="skeleton skeletonText short" />
                  </div>
                </div>
                <div className="userProjectStat">
                  <span className="userProjectStatIcon" />
                  <div style={{ width: "100%" }}>
                    <div className="skeleton skeletonText short" />
                  </div>
                </div>
                <div className="userProjectStat">
                  <span className="userProjectStatIcon" />
                  <div style={{ width: "100%" }}>
                    <div className="skeleton skeletonText short" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="userProjectsEmpty">
          <div className="userProjectsEmptyIcon">
            <FiFolder />
          </div>
          <h3>No projects found</h3>
          <p>
            {q
              ? "No project matches your search."
              : "You do not have any assigned projects yet."}
          </p>
        </div>
      ) : (
        <div className="userProjectsGrid">
          {filtered.map((project) => {
            const progress = normalizeProgress(Number(project.progress || 0));

            return (
              <Link
                key={project.id}
                to={`/user/projects/${project.id}`}
                className="userProjectCard"
              >
                <div className="userProjectCardTop">
                  <div className="userProjectTitleWrap">
                    <h3>{project.name}</h3>
                    <p>
                      {project.description ||
                        "No description added for this project."}
                    </p>
                  </div>

                  <span
                    className={`projectStatusBadge ${getStatusClass(project.status)}`}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>

                <div className="userProjectProgressBlock">
                  <div className="userProjectProgressHead">
                    <span>Progress</span>
                    <strong>{progress}%</strong>
                  </div>

                  <div className="userProjectProgressTrack">
                    <div
                      className="userProjectProgressFill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="userProjectStats">
                  <div className="userProjectStat">
                    <span className="userProjectStatIcon">
                      <FiCheckCircle />
                    </span>
                    <div>
                      <strong>
                        {project.completed_tasks}/{project.total_tasks}
                      </strong>
                      <p>Tasks done</p>
                    </div>
                  </div>

                  <div className="userProjectStat">
                    <span className="userProjectStatIcon">
                      <FiUsers />
                    </span>
                    <div>
                      <strong>{project.member_count}</strong>
                      <p>Members</p>
                    </div>
                  </div>

                  <div className="userProjectStat">
                    <span className="userProjectStatIcon">
                      <FiCalendar />
                    </span>
                    <div>
                      <strong>{formatDate(project.due_date)}</strong>
                      <p>Deadline</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}