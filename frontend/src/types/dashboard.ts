import { TaskStatus } from "./task";

export type Attachment = {
  id: number;
  original_name: string;
  uploaded_at?: string | null;
  download_url: string;
};


export type CommentRow = {
  id: number;
  task_id?: number;
  task_title?: string;
  user_id: number;
  user_name: string;
  comment: string;
  created_at?: string | null;
};
export type Filters = {
  q: string;
  status?: "ALL" | TaskStatus;
  due: "ALL" | "TODAY" | "THIS_WEEK" | "OVERDUE";
  sort: "NEWEST" | "DUE_SOON" | "PRIORITY" | "STATUS";
};

export type StatusKey = "PENDING" | "IN_PROGRESS" | "DONE" | string;
