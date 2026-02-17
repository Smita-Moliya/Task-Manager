import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { deleteUser } from "../api/users";
import { useAuth } from "../auth/useAuth";

type Role = "ADMIN" | "USER";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
};

export default function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const loadUsers = async () => {
    setMsg("");
    setLoading(true);
    try {
      const res = await api.get("/users/");
      setUsers(res.data?.users || []);
    } catch (err) {
      setMsg("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onDelete = async (id: number, role: Role) => {
    setMsg("");

    // safety (optional): don't allow deleting admins
    if (role === "ADMIN") {
      setMsg("You cannot delete an ADMIN user.");
      return;
    }

    // safety: don't allow deleting self
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

  return (
    <div>
      <h3 style={{ marginBottom: 10 }}>Users</h3>

      {msg && (
        <div style={{ marginBottom: 10, color: msg.includes("✅") ? "green" : "red" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={10} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 120 }}>Role</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button
                    onClick={() => onDelete(u.id, u.role)}
                    style={{ cursor: "pointer" }}
                    disabled={u.role === "ADMIN" || user?.id === u.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
