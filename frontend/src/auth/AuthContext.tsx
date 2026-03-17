import React, { createContext, useEffect, useMemo, useState } from "react";
import { AuthUser, AuthContextValue } from "../types/authType";


//This creates a global shared container.
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
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
    setIsInitializing(false);
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

  //useMemo keeps the same reference until one of dependencies changes.
  const value = useMemo(
    () => ({ user, access, refresh, isInitializing,  login,setAccess, setRefresh, logout }),
    [user, access, refresh, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
