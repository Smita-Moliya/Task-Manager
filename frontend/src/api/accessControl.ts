import { api } from "./api";

export type RoleKey = "ADMIN" | "USER";

export type PageAccessItem = {
  page_key: string;
  label: string;
  description: string;
  allowed: boolean;
};

export type RoleAccess = {
  role: RoleKey;
  pages: PageAccessItem[];
};

export type AccessControlResponse = {
  roles: RoleAccess[];
};

export async function getAccessControl(): Promise<AccessControlResponse> {
  const res = await api.get("/access-control/");
  return res.data;
}

export async function updateAccessControl(payload: {
  role: RoleKey;
  pages: { page_key: string; allowed: boolean }[];
}) {
  const res = await api.put("/access-control/", payload);
  return res.data;
}