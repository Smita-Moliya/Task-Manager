import React, { createContext, useEffect, useMemo, useState } from "react";

export type Role = "ADMIN" | "USER";

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  access: string | null;
  refresh: string | null;
  login: (access: string, refresh: string, user: AuthUser) => void;
  setAccess: (refresh: string | null) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const a = localStorage.getItem("access");
    const r = localStorage.getItem("refresh");
    const u = localStorage.getItem("user");

    if (a && r && u) {
      setAccess(a);
      setRefresh(r);
      try {
        setUser(JSON.parse(u));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

 

  const login = (newAccess: string, newRefresh: string, newUser: AuthUser) => {
    localStorage.setItem("access", newAccess);
    localStorage.setItem("refresh", newRefresh);
    localStorage.setItem("user", JSON.stringify(newUser));
    setAccess(newAccess);
    setRefresh(newRefresh);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setAccess(null);
    setRefresh(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, access, refresh, login,setAccess, setRefresh, logout }),
    [user, access, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
