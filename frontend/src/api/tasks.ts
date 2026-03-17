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



export type TaskPayload = {
  title: string;
  description?: string | null;
  status: string;
  assigned_to: number;
  due_date?: string | null;
  project_id: number;
};

export async function createTask(payload: TaskPayload) {
  return api.post("/tasks/create/", payload);
}

export async function updateTask(taskId: number, payload: Partial<TaskPayload>) {
  return api.put(`/tasks/${taskId}/update/`, payload);
}

export async function getTasks(params?: {
  q?: string;
  assigned_to?: number;
  project_id?: number;
  status?: string;
  page?: number;
}) {
  return api.get("/tasks/", { params });
}