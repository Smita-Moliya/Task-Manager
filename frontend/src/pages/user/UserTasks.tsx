import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiSearch,
  FiTrendingUp,
  FiGrid,
  FiList,
} from "react-icons/fi";
import TaskControls from "../../components/dashboard/TaskControls";
import TaskDetailModal from "../../components/dashboard/TaskDetailModal";
import ThemeToggle from "../../components/ThemeToggle";
import UserPageHeader from "./UserPageHeader";
import { useUserData } from "./UserContext";
import "../../css/userTasksPage.css";

type BoardStatus = "PENDING" | "IN_PROGRESS" | "DONE";
type ActiveSection = "PROJECT" | "GENERAL";

type TaskRow = {
  id: number;
  title: string;
  description?: string | null;
  status: BoardStatus;
  due_date?: string | null;
  project_name?: string | null;
  assigned_to_name?: string | null;
};

type ProjectGroup = {
  projectName: string;
  tasks: TaskRow[];
};

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No due date";

  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function sortTasksByDueDate(tasks: TaskRow[]) {
  return [...tasks].sort((a, b) => {
    const ad = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });
}

function getStatusLabel(status: BoardStatus) {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "DONE") return "Done";
  return "Pending";
}

function getStatusClass(status: BoardStatus) {
  if (status === "IN_PROGRESS") return "progress";
  if (status === "DONE") return "done";
  return "pending";
}

function getStatusIcon(status: BoardStatus) {
  if (status === "IN_PROGRESS") return <FiTrendingUp />;
  if (status === "DONE") return <FiCheckCircle />;
  return <FiClock />;
}

function SectionTabs({
  active,
  onChange,
  projectCount,
  generalCount,
}: {
  active: ActiveSection;
  onChange: (value: ActiveSection) => void;
  projectCount: number;
  generalCount: number;
}) {
  return (
    <div className="taskSectionTabs">
      <button
        type="button"
        className={`taskSectionTab ${active === "PROJECT" ? "active" : ""}`}
        onClick={() => onChange("PROJECT")}
      >
        <span className="taskSectionTabLabel">
          <FiFolder />
          Project Tasks
        </span>
        <span className="taskSectionTabCount">{projectCount}</span>
      </button>

      <button
        type="button"
        className={`taskSectionTab ${active === "GENERAL" ? "active" : ""}`}
        onClick={() => onChange("GENERAL")}
      >
        <span className="taskSectionTabLabel">
          <FiList />
          General Tasks
        </span>
        <span className="taskSectionTabCount">{generalCount}</span>
      </button>
    </div>
  );
}

function ProjectTasksSection({
  groups,
  onOpen,
}: {
  groups: ProjectGroup[];
  onOpen: (task: TaskRow) => void;
}) {
  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);

  return (
    <section className="taskPanelCard">
      <div className="taskPanelHeader">
        <div>
          <h2 className="taskPanelTitle">Project Tasks</h2>
          <p className="taskPanelSub">View all tasks linked with projects.</p>
        </div>
        <span className="taskPanelBadge">{totalTasks} Tasks</span>
      </div>

      {!groups.length ? (
        <div className="taskEmptyState">No project tasks found.</div>
      ) : (
        <div className="taskProjectGroupList">
          {groups.map((group, index) => {
            const doneCount = group.tasks.filter((t) => t.status === "DONE").length;

            return (
              <section key={`${group.projectName}-${index}`} className="taskProjectGroupCard">
                <div className="taskProjectGroupHead">
                  <div className="taskProjectGroupTitleWrap">
                    <div className="taskProjectGroupIcon">
                      <FiFolder />
                    </div>

                    <div>
                      <div className="taskProjectGroupTitleRow">
                        <h3 className="taskProjectGroupTitle">{group.projectName}</h3>
                      </div>
                      <p className="taskProjectGroupSub">Project-linked tasks</p>
                    </div>
                  </div>

                  <div className="taskProjectGroupStats">
                    <span className="taskMiniBadge">{group.tasks.length} Task{group.tasks.length !== 1 ? "s" : ""}</span>
                    <span className="taskMiniBadge neutral">{doneCount} Done</span>
                  </div>
                </div>

                <div className="taskListTable">
                  <div className="taskListTableHead">
                    <span>Task</span>
                    <span>Assigned</span>
                    <span>Status</span>
                    <span>Due</span>
                    <span>Actions</span>
                  </div>

                  <div className="taskListTableBody">
                    {group.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="taskListRow"
                        onClick={() => onOpen(task)}
                      >
                        <div className="taskListCell taskCellTask">
                          <strong>{task.title}</strong>
                          <span>{task.description?.trim() || "No description added."}</span>
                        </div>

                        <div className="taskListCell taskCellAssigned">
                          <strong>{task.assigned_to_name || "Unassigned"}</strong>
                          <span>{group.projectName}</span>
                        </div>

                        <div className="taskListCell">
                          <span className={`taskStatusPill ${getStatusClass(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {getStatusLabel(task.status)}
                          </span>
                        </div>

                        <div className="taskListCell taskCellDue">
                          <strong>{formatDate(task.due_date)}</strong>
                        </div>

                        <div className="taskListCell">
                          <span className="taskOpenBtn">Open</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function GeneralTasksSection({
  tasks,
  onOpen,
}: {
  tasks: TaskRow[];
  onOpen: (task: TaskRow) => void;
}) {
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <section className="taskPanelCard">
      <div className="taskPanelHeader">
        <div>
          <h2 className="taskPanelTitle">General Tasks</h2>
          <p className="taskPanelSub">View all standalone tasks not linked with projects.</p>
        </div>
        <div className="taskProjectGroupStats">
          <span className="taskMiniBadge">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</span>
          <span className="taskMiniBadge neutral">{doneCount} Done</span>
        </div>
      </div>

      {!tasks.length ? (
        <div className="taskEmptyState">No general tasks found.</div>
      ) : (
        <div className="taskListTable">
          <div className="taskListTableHead">
            <span>Task</span>
            <span>Assigned</span>
            <span>Status</span>
            <span>Due</span>
            <span>Actions</span>
          </div>

          <div className="taskListTableBody">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="taskListRow"
                onClick={() => onOpen(task)}
              >
                <div className="taskListCell taskCellTask">
                  <strong>{task.title}</strong>
                  <span>{task.description?.trim() || "No description added."}</span>
                </div>

                <div className="taskListCell taskCellAssigned">
                  <strong>{task.assigned_to_name || "Unassigned"}</strong>
                  <span>General Task</span>
                </div>

                <div className="taskListCell">
                  <span className={`taskStatusPill ${getStatusClass(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div className="taskListCell taskCellDue">
                  <strong>{formatDate(task.due_date)}</strong>
                </div>

                <div className="taskListCell">
                  <span className="taskOpenBtn">Open</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function UserTasks() {
  const { filteredTasks, filters, setFilters, reload, setSelectedTaskId } = useUserData();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [boardTasks, setBoardTasks] = useState<TaskRow[]>([]);
  const [activeSection, setActiveSection] = useState<ActiveSection>("PROJECT");

  useEffect(() => {
    const normalized: TaskRow[] = (filteredTasks as TaskRow[]).map((t) => ({
      ...t,
      status:
        t.status === "DONE" || t.status === "IN_PROGRESS" || t.status === "PENDING"
          ? t.status
          : "PENDING",
    }));

    setBoardTasks(normalized);
  }, [filteredTasks]);

  const groupedData = useMemo(() => {
    const projectTasks = sortTasksByDueDate(
      boardTasks.filter((task) => !!task.project_name && !!task.project_name.trim())
    );

    const generalTasks = sortTasksByDueDate(
      boardTasks.filter((task) => !task.project_name || !task.project_name.trim())
    );

    const projectMap = new Map<string, TaskRow[]>();

    for (const task of projectTasks) {
      const key = task.project_name!.trim();
      if (!projectMap.has(key)) projectMap.set(key, []);
      projectMap.get(key)!.push(task);
    }

    const projectGroups: ProjectGroup[] = Array.from(projectMap.entries()).map(
      ([projectName, tasks]) => ({
        projectName,
        tasks: sortTasksByDueDate(tasks),
      })
    );

    projectGroups.sort((a, b) => a.projectName.localeCompare(b.projectName));

    return {
      projectGroups,
      generalTasks,
      totals: {
        all: boardTasks.length,
        project: projectTasks.length,
        general: generalTasks.length,
        completed: boardTasks.filter((task) => task.status === "DONE").length,
      },
    };
  }, [boardTasks]);

  const handleOpen = (task: TaskRow) => {
    setSelectedId(task.id);
    setSelectedTaskId(task.id);
  };

  return (
    <div className="userTasksBoardPage">
      <UserPageHeader
        eyebrow="WORKSPACE"
        title="Task Management"
        subtitle="Manage project tasks and personal tasks in one place."
        rightSlot={<ThemeToggle />}
      />

      <div className="userTasksBoardContainer">
        <section className="taskFilterTopBar">
          <div className="taskFilterTopGrow">
            <div className="boardFiltersTopRow">
              <div className="boardFilterSearchIcon">
                <FiSearch />
              </div>

              <div className="taskControlsBoardWrap">
                <TaskControls value={filters} onChange={setFilters} />
              </div>
            </div>
          </div>
        </section>

        <section className="taskMainShellCard">
          <div className="taskMainShellTabs">
            <SectionTabs
              active={activeSection}
              onChange={setActiveSection}
              projectCount={groupedData.totals.project}
              generalCount={groupedData.totals.general}
            />
          </div>

          <div className="taskMainShellBody">
            {activeSection === "PROJECT" ? (
              <ProjectTasksSection
                groups={groupedData.projectGroups}
                onOpen={handleOpen}
              />
            ) : (
              <GeneralTasksSection
                tasks={groupedData.generalTasks}
                onOpen={handleOpen}
              />
            )}
          </div>
        </section>
      </div>

      <TaskDetailModal
        open={!!selectedId}
        taskId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={reload}
      />
    </div>
  );
}