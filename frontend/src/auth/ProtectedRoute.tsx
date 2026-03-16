import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Role } from "./AuthContext";

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, access, refresh } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  // allow staying if refresh exists (axios will refresh on next API call)
  if (!access && refresh) return <>{children}</>;

  if (!access) return <Navigate to="/" replace />;

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/user"} replace />;
  }

  return <>{children}</>;
}
