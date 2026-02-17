import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api" // your axios instance
import axios, { AxiosError } from "axios";

export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");

    if (!token) return setMsg("Token missing in URL.");
    if (!password) return setMsg("Password is required.");
    if (password.length < 4) return setMsg("Password must be at least 4 characters.");
    if (password !== confirmPassword) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      const res = await api.post("/auth/set-password/", {
        token,
        password,
        confirm_password: confirmPassword,
      });

      setMsg(res.data?.message || "Password set ✅ Now login.");
      setTimeout(() => navigate("/"), 1000); // go back to login
    } catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    setMsg(err.response?.data?.message || "Request failed");
  } else {
    setMsg("Unexpected error occurred");
  }
} finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "60px auto", padding: 20 }}>
      <h2>Set Password</h2>

      {!token && (
        <p style={{ color: "red" }}>
          Token not found. Please open the link from your email again.
        </p>
      )}

      {msg && <div style={{ margin: "12px 0", color: msg.includes("✅") ? "green" : "red" }}>{msg}</div>}

      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>New Password</label>
          <input
            style={{ width: "100%", padding: 10 }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Confirm Password</label>
          <input
            style={{ width: "100%", padding: 10 }}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          style={{ width: "100%", padding: 12, cursor: "pointer" }}
        >
          {loading ? "Setting..." : "Set Password"}
        </button>
      </form>
    </div>
  );
}
