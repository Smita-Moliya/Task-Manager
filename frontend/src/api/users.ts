import { api } from "./api";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export async function deleteUser(userId: number): Promise<ApiResult<{ message: string }>> {
  try {
    const res = await api.delete(`/users/${userId}/delete/`);
    return { ok: true, data: res.data };
  } catch (err: unknown) {
    const anyErr = err as any;
    if (!anyErr?.response) {
      return { ok: false, status: 0, message: "Network/CORS/backend down" };
    }
    return {
      ok: false,
      status: anyErr.response.status,
      message: anyErr.response.data?.message || "Delete failed",
    };
  }
}

export async function updateUser(
  userId: number,
  payload: { name: string; email: string; role: string }
): Promise<ApiResult<{ message: string; user?: any }>> {
  try {
    const res = await api.put(`/users/${userId}/update/`, payload);
    return { ok: true, data: res.data };
  } catch (err: unknown) {
    const anyErr = err as any;
    if (!anyErr?.response) {
      return { ok: false, status: 0, message: "Network/CORS/backend down" };
    }
    return {
      ok: false,
      status: anyErr.response.status,
      message: anyErr.response.data?.message || "Update failed",
    };
  }
}