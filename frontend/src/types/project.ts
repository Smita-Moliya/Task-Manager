export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH";
export type ProjectMemberRole = "LEAD" | "DEVELOPER" | "TESTER" | "MEMBER";

export type ProjectRow = {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  task_count?: number;
  completed_count?: number;
  pending_count?: number;
};

export type ProjectSummary = {
  project_id: number;
  project_name: string;
  member_count: number;
  task_count: number;
  completed_count: number;
  pending_count: number;
  overdue_count: number;
};

export type ProjectMemberRow = {
  id: number;
  project_id: number;
  user_id: number;
  member_role: ProjectMemberRole | string;
  added_at: string | null;
  name: string;
  email: string;
  role: string;
};

export type ProjectPayload = {
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date?: string | null;
  end_date?: string | null;
};

export type AddProjectMembersPayload = {
  members: {
    user_id: number;
    member_role?: ProjectMemberRole;
  }[];
};

export type ProjectAnalyticsSummary = {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  on_hold_projects: number;
};

export type ProjectAnalyticsRow = {
  project_id: number;
  project_name: string;
  task_count: number;
  completed_count: number;
  pending_count: number;
  member_count: number;
  progress_percent: number;
};