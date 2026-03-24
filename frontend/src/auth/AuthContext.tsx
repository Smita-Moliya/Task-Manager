import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  AuthContextValue,
  PermissionMap,
  PageAccessMap,
} from "../types/authType";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [pages, setPages] = useState<PageAccessMap>({});
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const a = localStorage.getItem("access");
      const r = localStorage.getItem("refresh");
      const u = localStorage.getItem("user");
      const p = localStorage.getItem("permissions");
      const pg = localStorage.getItem("pages");

      if (a && r && u) {
        const parsedUser: AuthUser = JSON.parse(u);
        const parsedPermissions: PermissionMap = p ? JSON.parse(p) : {};
        const parsedPages: PageAccessMap = pg ? JSON.parse(pg) : {};

        setAccess(a);
        setRefresh(r);
        setUser(parsedUser);
        setPermissions(parsedPermissions);
        setPages(parsedPages);
      } else {
        setAccess(null);
        setRefresh(null);
        setUser(null);
        setPermissions({});
        setPages({});
      }
    } catch {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("pages");

      setAccess(null);
      setRefresh(null);
      setUser(null);
      setPermissions({});
      setPages({});
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const login = (
    newAccess: string,
    newRefresh: string,
    newUser: AuthUser,
    newPermissions: PermissionMap = {},
    newPages: PageAccessMap = {}
  ) => {
    localStorage.setItem("access", newAccess);
    localStorage.setItem("refresh", newRefresh);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("permissions", JSON.stringify(newPermissions));
    localStorage.setItem("pages", JSON.stringify(newPages));

    setAccess(newAccess);
    setRefresh(newRefresh);
    setUser(newUser);
    setPermissions(newPermissions);
    setPages(newPages);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    localStorage.removeItem("pages");

    setAccess(null);
    setRefresh(null);
    setUser(null);
    setPermissions({});
    setPages({});
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      access,
      refresh,
      permissions,
      pages,
      isInitializing,
      login,
      setAccess,
      setRefresh,
      setPermissions,
      setPages,
      logout,
    }),
    [user, access, refresh, permissions, pages, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}