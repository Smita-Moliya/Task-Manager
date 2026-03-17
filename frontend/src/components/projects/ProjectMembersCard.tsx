import { FiTrash2, FiUsers } from "react-icons/fi";
import { removeProjectMember } from "../../api/projectMembers";
import { ProjectMemberRow } from "../../types/project";

type Props = {
  projectId: number;
  members: ProjectMemberRow[];
  onReload: () => Promise<void>;
};

function getRoleClass(role?: string) {
  const r = (role || "").toUpperCase();

  if (r === "LEAD") return "memberRoleBadge lead";
  if (r === "DEVELOPER") return "memberRoleBadge developer";
  if (r === "TESTER") return "memberRoleBadge tester";
  if (r === "DESIGNER") return "memberRoleBadge designer";
  return "memberRoleBadge member";
}

export default function ProjectMembersCard({
  projectId,
  members,
  onReload,
}: Props) {
  async function handleRemove(userId: number) {
    const ok = window.confirm("Remove this member from the project?");
    if (!ok) return;

    const res = await removeProjectMember(projectId, userId);
    if (!res.ok) {
      window.alert(res.message || "Could not remove member.");
      return;
    }

    await onReload();
  }

  return (
    <div className="workspacePanelCard membersPanelCard">
      <div className="workspacePanelHeader">
        <div className="workspacePanelTitleWrap">
          <div className="workspacePanelIcon">
            <FiUsers />
          </div>

          <div>
            <h3 className="workspacePanelTitle">Members</h3>
            <p className="workspacePanelSub">
              View and manage people assigned to this project.
            </p>
          </div>
        </div>

        <div className="workspacePanelMeta">
          {members.length} member{members.length === 1 ? "" : "s"}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="workspaceEmptyState">
          <div className="workspaceEmptyStateTitle">No members added yet</div>
          <div className="workspaceEmptyStateSub">
            Add project members to start assigning work and collaborating.
          </div>
        </div>
      ) : (
        <div className="workspaceMemberList">
          {members.map((m) => (
            <div key={m.user_id} className="workspaceMemberRow">
              <div className="workspaceMemberInfo">
                <div className="workspaceMemberTopLine">
                  <div className="workspaceMemberName">{m.name}</div>
                  <span className={getRoleClass(m.member_role)}>
                    {m.member_role}
                  </span>
                </div>

                <div className="workspaceMemberMeta">{m.email}</div>
              </div>

              <button
                type="button"
                className="workspaceDangerBtn"
                onClick={() => handleRemove(m.user_id)}
              >
                <FiTrash2 />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}