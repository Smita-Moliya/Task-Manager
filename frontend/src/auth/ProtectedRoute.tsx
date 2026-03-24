import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Role } from "../types/authType";
import { hasPageAccess, hasPermission } from "../utils/access";
import { getFirstAllowedRoute } from "../utils/routeAccess";

type ProtectedRouteProps = {
  allow?: Role[];
  pageKey?: string;
  permission?: string;
  children: React.ReactNode;
};

export default function ProtectedRoute({
  allow,
  pageKey,
  permission,
  children,
}: ProtectedRouteProps) {
  const { user, access, isInitializing, pages, permissions } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!user || !access) {
    return <Navigate to="/" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to={getFirstAllowedRoute(user.role, pages)} replace />;
  }

  if (
    user.role !== "SUPERUSER" &&
    pageKey &&
    !hasPageAccess(pages, pageKey)
  ) {
    return <Navigate to={getFirstAllowedRoute(user.role, pages)} replace />;
  }

  if (
    user.role !== "SUPERUSER" &&
    permission &&
    !hasPermission(permissions, permission)
  ) {
    return <Navigate to={getFirstAllowedRoute(user.role, pages)} replace />;
  }

  return <>{children}</>;
}