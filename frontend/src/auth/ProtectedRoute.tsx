import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Role } from "../types/authType";

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user, access, refresh, isInitializing } = useAuth();

  if (isInitializing) return null; // or loader

  if (!user) return <Navigate to="/" replace />;

  if (!access && refresh) return <>{children}</>;

  if (!access) return <Navigate to="/" replace />;

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/user"} replace />;
  }

  return <>{children}</>;
}