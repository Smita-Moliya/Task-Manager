import { api } from "./api";
import { ProjectPayload, ProjectRow, ProjectSummary } from "../types/project";

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

export async function getProjects(params?: { q?: string; status?: string }): Promise<ApiResult<{ projects: ProjectRow[] }>> {
  try {
    const res = await api.get("/projects/", { params });
    return { ok: true, data: { projects: res.data?.projects || [] } };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function getProject(projectId: number): Promise<ApiResult<{ project: ProjectRow; summary: ProjectSummary }>> {
  try {
    const res = await api.get(`/projects/${projectId}/`);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function createProject(payload: ProjectPayload): Promise<ApiResult<{ message: string; project: ProjectRow }>> {
  try {
    const res = await api.post("/projects/create/", payload);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function updateProject(projectId: number, payload: ProjectPayload): Promise<ApiResult<{ message: string; project: ProjectRow }>> {
  try {
    const res = await api.put(`/projects/${projectId}/update/`, payload);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

export async function deleteProject(projectId: number): Promise<ApiResult<{ message: string }>> {
  try {
    const res = await api.delete(`/projects/${projectId}/delete/`);
    return { ok: true, data: res.data };
  } catch (err: any) {
    return { ok: false, ...getError(err) };
  }
}

