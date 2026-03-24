export type Role = "SUPERUSER" | "ADMIN" | "USER";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type PermissionMap = Record<string, boolean>;
export type PageAccessMap = Record<string, boolean>;

export type AuthContextValue = {
  user: AuthUser | null;
  access: string | null;
  refresh: string | null;
  permissions: PermissionMap;
  pages: PageAccessMap;
  isInitializing: boolean;
  login: (
    newAccess: string,
    newRefresh: string,
    newUser: AuthUser,
    newPermissions?: PermissionMap,
    newPages?: PageAccessMap
  ) => void;
  setAccess: React.Dispatch<React.SetStateAction<string | null>>;
  setRefresh: React.Dispatch<React.SetStateAction<string | null>>;
  setPermissions: React.Dispatch<React.SetStateAction<PermissionMap>>;
  setPages: React.Dispatch<React.SetStateAction<PageAccessMap>>;
  logout: () => void;
};