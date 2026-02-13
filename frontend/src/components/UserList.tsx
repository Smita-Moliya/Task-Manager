import { useEffect, useState } from "react";
import { api } from "../api/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
};

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchUsers = async () => {
    setMsg("");
    setBusy(true);
    try {
      const res = await api.get("/users/");
      setUsers(res.data.users || []);
    } catch (err: any) {
      setMsg(err?.response?.data?.message || "Failed to load users");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <div className="rowBetween">
        <div>
          <h3 className="cardTitle" style={{ marginBottom: 4 }}>
            All Users
          </h3>
          
        </div>

        <button className="btn" onClick={fetchUsers} disabled={busy}>
          {busy ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {msg && <div className="alert error">{msg}</div>}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th style={{ width: 140 }}>Role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === "ADMIN" ? "admin" : "user"}`}>
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}

            {users.length === 0 && !busy && (
              <tr>
                <td colSpan={4} className="emptyCell">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
