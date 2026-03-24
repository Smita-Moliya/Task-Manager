import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/api";
import { deleteUser, updateUser } from "../api/users";
import { useAuth } from "../auth/useAuth";
import { Role, UserRow, Props } from "../types/user";

export default function UserList({ page, pageSize, onTotalPages }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [query, setQuery] = useState("");

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "USER" as Role,
  });
  const [saving, setSaving] = useState(false);

  const isSuperuserUsersPage = location.pathname.startsWith("/superuser/users");
  const isSuperuserAdminsPage = location.pathname.startsWith("/superuser/admins");

  const loadUsers = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/users/", {
        params: { page, page_size: pageSize },
      });

      const list = (res.data?.items ?? res.data?.users) as UserRow[] | undefined;
      const rawUsers = Array.isArray(list) ? list : [];

      let scopedUsers = rawUsers;

      if (isSuperuserAdminsPage) {
        scopedUsers = rawUsers.filter((u) => u.role === "ADMIN");
      } else if (isSuperuserUsersPage) {
        scopedUsers = rawUsers.filter((u) => u.role === "USER");
      }

      setUsers(scopedUsers);

      const tp = Number(res.data?.total_pages || 1);
      onTotalPages?.(Number.isFinite(tp) && tp > 0 ? tp : 1);
    } catch (err: any) {
      setUsers([]);
      setMsg(err?.response?.data?.message || "Failed to load users");
      onTotalPages?.(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, location.pathname]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const hay = `${u.id} ${u.name} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  const closeEditModal = () => {
    if (saving) return;
    setEditingUser(null);
    setEditForm({
      name: "",
      email: "",
      role: "USER",
    });
  };

  const onDelete = async (id: number, role: Role) => {
    setMsg("");

    if (role === "ADMIN") {
      setMsg("You cannot delete an ADMIN user.");
      return;
    }

    if (user?.id === id) {
      setMsg("You cannot delete your own account.");
      return;
    }

    const ok = window.confirm("Delete this user?");
    if (!ok) return;

    const res = await deleteUser(id);
    if (!res.ok) {
      setMsg(res.message);
      return;
    }

    setMsg("User deleted ✅");
    loadUsers();
  };

  const onEditClick = (u: UserRow) => {
    setMsg("");
    setEditingUser(u);
    setEditForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role,
    });
  };

  const onSaveEdit = async () => {
    if (!editingUser) return;

    setMsg("");
    if (!editForm.name.trim()) {
      setMsg("Name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      setMsg("Email is required.");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role:
        editingUser.role === "ADMIN" || user?.id === editingUser.id
          ? editingUser.role
          : editForm.role,
    };

    setSaving(true);
    try {
      const res = await updateUser(editingUser.id, payload);

      if (!res.ok) {
        setMsg(res.message);
        return;
      }

      setMsg("User updated ✅");
      closeEditModal();
      loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const emptyText = isSuperuserAdminsPage
    ? "No admins found"
    : isSuperuserUsersPage
    ? "No users found"
    : "No users found";

  return (
    <div>
      {msg ? (
        <div
          className={`alert ${msg.includes("✅") ? "success" : "error"}`}
          style={{ marginBottom: 12 }}
        >
          {msg}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name, email, role, or ID…"
          style={{ flex: 1 }}
        />
        {query ? (
          <button className="adminBtn adminBtnGhost" onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="muted" style={{ padding: 10 }}>
          Loading…
        </div>
      ) : (
        <div className="usersWrap">
          <div className="tableWrap" style={{ border: "none", marginTop: 0 }}>
            <table className="usersTable">
              <thead>
                <tr>
                  <th className="usersColId">ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th style={{ width: 140 }}>Role</th>
                  <th className="usersColAction">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => {
                  const disableDelete = u.role === "ADMIN" || user?.id === u.id;

                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td className="userName">{u.name}</td>
                      <td>
                        <span className="usersEmail">{u.email}</span>
                      </td>
                      <td>
                        <span
                          className={`rolePill ${
                            u.role === "ADMIN" ? "admin" : "user"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="usersColAction">
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button
                            className="adminBtn adminBtnGhost"
                            onClick={() => onEditClick(u)}
                            title={
                              user?.id === u.id
                                ? "Edit your profile"
                                : u.role === "ADMIN"
                                ? "Edit admin details"
                                : "Edit user"
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="userDelBtn"
                            onClick={() => onDelete(u.id, u.role)}
                            disabled={disableDelete}
                            title={
                              u.role === "ADMIN"
                                ? "Admins cannot be deleted"
                                : user?.id === u.id
                                ? "You cannot delete yourself"
                                : "Delete user"
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="emptyCell">
                      {users.length === 0 ? emptyText : "No matching users"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser ? (
        <div className="userModalOverlay" onClick={closeEditModal}>
          <div className="userModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="userModalHeader">
              <h3 style={{ margin: 0 }}>
                Edit User{" "}
                {editingUser.role === "ADMIN" || user?.id === editingUser.id
                  ? "(Role locked)"
                  : ""}
              </h3>
              <button
                className="userModalClose"
                onClick={closeEditModal}
                disabled={saving}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="userModalBody">
              <div className="userModalField">
                <label>Name</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter name"
                />
              </div>

              <div className="userModalField">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email"
                />
              </div>

              <div className="userModalField">
                <label>Role</label>
                <select
                  className="input"
                  value={editForm.role}
                  disabled={editingUser.role === "ADMIN" || user?.id === editingUser.id}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: e.target.value as Role,
                    }))
                  }
                  title={
                    editingUser.role === "ADMIN" || user?.id === editingUser.id
                      ? "Role cannot be changed here"
                      : "Change role"
                  }
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="userModalFooter">
              <button
                className="adminBtn adminBtnGhost"
                onClick={closeEditModal}
                disabled={saving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="adminBtn"
                onClick={onSaveEdit}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}