import { api } from "./api";

export async function deleteTask(taskId: number) {
  try {
    const res = await api.delete(`/tasks/${taskId}/`);
    return { ok: true, data: res.data };
  } catch (err: any) {
    if (!err?.response) {
      return { ok: false, status: 0, message: "Network/CORS/backend down" };
    }
    return {
      ok: false,
      status: err.response.status,
      message: err.response.data?.message || "Delete failed",
    };
  }
}
