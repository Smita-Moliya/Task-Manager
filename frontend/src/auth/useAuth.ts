import { useContext } from "react";
import { AuthContext } from "./AuthContext";

//It is the safe access point to your entire authentication system.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
