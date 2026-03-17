import { useMemo, useState } from "react";
import { FiPlus, FiShield, FiUser } from "react-icons/fi";
import { addProjectMembers } from "../../api/projectMembers";
import { ProjectMemberRole } from "../../types/project";

type UserOption = {
  id: number;
  name: string;
  email: string;
};

type Props = {
  projectId: number;
  allUsers: UserOption[];
  existingUserIds: number[];
  onDone: () => Promise<void>;
};

export default function AddProjectMembersBox({
  projectId,
  allUsers,
  existingUserIds,
  onDone,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [memberRole, setMemberRole] = useState<ProjectMemberRole>("MEMBER");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const selectableUsers = useMemo(
    () => allUsers.filter((u) => !existingUserIds.includes(u.id)),
    [allUsers, existingUserIds]
  );

  const selectedUser = useMemo(
    () => selectableUsers.find((u) => u.id === selectedUserId),
    [selectableUsers, selectedUserId]
  );

  async function handleAddMember(e: React.FormEvent) {
  e.preventDefault();

  if (!selectedUserId) {
    setMsg("Please select a user.");
    return;
  }

  setBusy(true);
  setMsg("");

  try {
    const res = await addProjectMembers(projectId, {
      members: [
        {
          user_id: Number(selectedUserId),
          member_role: memberRole,
        },
      ],
    });

    if (!res.ok) {
      setMsg(res.message || "Could not add member.");
      return;
    }

    setSelectedUserId("");
    setMemberRole("MEMBER");
    setMsg("Member added successfully.");
    await onDone();
  } catch {
    setMsg("Could not add member.");
  } finally {
    setBusy(false);
  }
}

  return (
    <div className="workspacePanelCard addMemberCard">
      <div className="workspacePanelHeader">
        <div className="workspacePanelTitleWrap">
          <div className="workspacePanelIcon">
            <FiUser />
          </div>

          <div>
            <h3 className="workspacePanelTitle">Add Member</h3>
            <p className="workspacePanelSub">
              Assign a user to this project with a specific role.
            </p>
          </div>
        </div>

        <div className="workspacePanelMeta">
          {selectableUsers.length} available
        </div>
      </div>

      {msg ? (
        <div
          className={`uiAlert addMemberAlert ${
            msg.toLowerCase().includes("success")
              ? "uiAlertSuccess"
              : "uiAlertInfo"
          }`}
        >
          {msg}
        </div>
      ) : null}

      {selectableUsers.length === 0 ? (
        <div className="workspaceEmptyState">
          <div className="workspaceEmptyStateTitle">All users are already added</div>
          <div className="workspaceEmptyStateSub">
            There are no more users available to assign to this project.
          </div>
        </div>
      ) : (
        <form onSubmit={handleAddMember} className="workspaceMemberForm">
          <div className="workspaceMemberFormGrid">
            <div className="formField">
              <label htmlFor="project-member-user">User</label>
              <div className="inputWithIcon">
                <span className="inputIcon">
                  <FiUser />
                </span>
                <select
                  id="project-member-user"
                  value={selectedUserId}
                  onChange={(e) =>
                    setSelectedUserId(e.target.value ? Number(e.target.value) : "")
                  }
                  disabled={busy}
                >
                  <option value="">Select User</option>
                  {selectableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="formField">
              <label htmlFor="project-member-role">Role</label>
              <div className="inputWithIcon">
                <span className="inputIcon">
                  <FiShield />
                </span>
                <select
                  id="project-member-role"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as ProjectMemberRole)}
                  disabled={busy}
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Lead</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="TESTER">Tester</option>
                  <option value="DESIGNER">Designer</option>
                </select>
              </div>
            </div>

            <div className="workspaceMemberAction">
              <button
                type="submit"
                className="workspacePrimaryBtn"
                disabled={busy || !selectedUserId}
              >
                <FiPlus />
                {busy ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>

          {selectedUser ? (
            <div className="workspaceSelectionPreview">
              <div className="workspaceSelectionPreviewLabel">Selected User</div>
              <div className="workspaceSelectionPreviewValue">{selectedUser.name}</div>
              <div className="workspaceSelectionPreviewSub">
                {selectedUser.email} • {memberRole}
              </div>
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}