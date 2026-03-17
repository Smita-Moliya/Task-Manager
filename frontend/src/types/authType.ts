export type Role = "ADMIN" | "USER";

export type AuthUser = {
  id: number;
  name: string;
  email?: string;
  role: Role;
};

export type AuthContextValue = {
  user: AuthUser | null;
  access: string | null;
  refresh: string | null;
  isInitializing: boolean;
  login: (access: string, refresh: string, user: AuthUser) => void;
  setAccess: (refresh: string | null) => void;
  logout: () => void;
};