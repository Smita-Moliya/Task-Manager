import TaskManager from "../../components/TaskManager";
import {useNavigate } from "react-router-dom";



export default function AdminTasks() {
    const navigate = useNavigate();
  return (
    <section className="adminCard">
      <div className="adminCardHead">
        <h3>Tasks</h3>
        <span>
            <button className="adminSideBtn" onClick={() => navigate("/admin/tasks/new")}>
            + Add Task
          </button>
        </span>
      </div>
      <div className="adminCardBody">
        <TaskManager />
      </div>
    </section>
  );
}