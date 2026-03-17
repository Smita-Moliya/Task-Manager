import { api } from "./api";
import { AddProjectMembersPayload, ProjectMemberRow } from "../types/project";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

function getError(err: any) {
  if (!err?.response) {
    return { status: 0, message: "Network/CORS/backend down" };
  }
  return {
    status: err.response.status,
    message: err.response.data?.message || "Request failed",
    errors: err.response.data?.errors,
  };
}

export async function getProjectMembers(projectId: number): Promise<ApiResult<{ members: ProjectMemberRow[] }>> {
  try {
    const res = await api.get(`/projects/${projectId}/members/`);
    return { ok: true, data: { members: res.data?.members || [] } };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function addProjectMembers(
  projectId: number,
  payload: AddProjectMembersPayload
): Promise<ApiResult<{ message: string; added: any[]; errors: any[] }>> {
  try {
    const res = await api.post(`/projects/${projectId}/members/add/`, payload);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function removeProjectMember(
  projectId: number,
  userId: number
): Promise<ApiResult<{ message: string }>> {
  try {
    const res = await api.delete(`/projects/${projectId}/members/${userId}/remove/`);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}