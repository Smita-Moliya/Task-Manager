import { useState } from "react";
import TaskAlerts from "../../components/dashboard/TaskAlerts";
import TaskControls from "../../components/dashboard/TaskControls";
import TaskList from "../../components/dashboard/TaskList";
import TaskDetailModal from "../../components/dashboard/TaskDetailModal";
import { useUserData } from "./UserContext";
import "../../css/userTask.css";

export default function UserTasks() {
  const {
    tasks,
    filteredTasks,
    filters,
    setFilters,
    msg,
    reload,
    setSelectedTaskId,
  } = useUserData();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="userPage">
      <div className="userContainer">
        {msg ? (
          <div className="uiAlert uiAlertError userPageAlert">
            {msg}
          </div>
        ) : null}

   

        <TaskAlerts tasks={tasks} />

        <div className="uiCard uiCardBodySm userTasksControlsCard">
          <TaskControls value={filters} onChange={setFilters} />
        </div>

        <section className="uiCard userTasksSection">
          <div className="uiCardHeader userTasksHeader">
            <div className="uiCardHeaderLeft">
              <h3 className="uiCardTitle">Your Tasks</h3>
              <p className="uiCardSub">
                View, filter, and open your assigned tasks.
              </p>
            </div>

            <span className="uiBadge uiBadgePrimary">List</span>
          </div>

          <div className="uiCardBody userTasksBody">
            <TaskList
              tasks={filteredTasks}
              onOpen={(t) => {
                setSelectedId(t.id);
                setSelectedTaskId(t.id);
              }}
            />
          </div>
        </section>

        <TaskDetailModal
          open={!!selectedId}
          taskId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={reload}
        />
      </div>
    </div>
  );
}