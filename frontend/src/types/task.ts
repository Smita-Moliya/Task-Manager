export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export type Attachment = {
  id: number;
  task_id: number;
  original_name: string;
  mime_type: string | null;
  uploaded_at: string | null;
  download_url: string;
};

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  due_date?: string | null | undefined;
  created_at?: string | null;
  updated_at?: string | null;
  assigned_by?: number;
  assigned_to?: number;
  project_id?: number | null;
  project_name?: string | null;
  assigned_to_name?: string | null;
  attachments?: Attachment[];
};

export type ByStatus = {
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  count: number;
};

export type ByUser = {
  name: string;
  count: number;
};

export type AttachmentRow = {
  id: number;
  task_id: number;
  task_title?: string;
  original_name: string;
  mime_type?: string | null;
  uploaded_at?: string | null;
  download_url: string;
};