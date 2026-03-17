import DashboardAttachments from "../../components/dashboard/DashboardAttachments";
import DashboardComments from "../../components/dashboard/DashboardComments";
import { useUserData } from "./UserContext";

export default function UserFiles() {
  const { selectedTaskId, setSelectedTaskId } = useUserData();

  if (!selectedTaskId) {
    return <div className="userMuted">Open a task first (from Tasks page) to view attachments & comments.</div>;
  }

  return (
    <div className="uDetailGrid">
      <section className="adminCard">
        <div className="adminCardHead">
          <h3>Attachments</h3>
          <button className="adminBtn adminBtnGhost" onClick={() => setSelectedTaskId(null)}>
            Clear
          </button>
        </div>
        <div className="adminCardBody">
          <DashboardAttachments taskId={selectedTaskId} />
        </div>
      </section>

      <section className="adminCard">
        <div className="adminCardHead">
          <h3>Comments</h3>
          <span className="adminChip">Notes</span>
        </div>
        <div className="adminCardBody">
          <DashboardComments taskId={selectedTaskId} />
        </div>
      </section>
    </div>
  );
}