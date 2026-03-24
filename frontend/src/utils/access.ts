import { PageAccessMap, PermissionMap } from "../types/authType";

const PAGE_KEY_ALIASES: Record<string, string[]> = {
  "admin.dashboard": ["admin.dashboard", "dashboard"],
  "admin.users": ["admin.users", "users"],
  "admin.projects": ["admin.projects", "projects"],
  "admin.tasks": ["admin.tasks", "tasks"],
  "admin.analytics": ["admin.analytics", "admin-stats"],
  // "admin.activity": ["admin.activity", "admin-activity"],
  // "admin.comments": ["admin.comments", "comments"],
  "admin.attachments": ["admin.attachments", "attachments"],
  "access-control": ["access-control"],

  "user.insights": ["user.insights", "dashboard", "insights"],
  "user.projects": ["user.projects", "projects"],
  "user.tasks": ["user.tasks", "tasks"],
  "user.activity": ["user.activity", "activity"],
  "user.comments": ["user.comments", "comments"],
  "user.attachments": ["user.attachments", "attachments"],
};

export function hasPageAccess(
  pages: PageAccessMap | undefined,
  pageKey: string
): boolean {
  if (!pages) return false;
  if (pages["*"] === true) return true;

  const aliases = PAGE_KEY_ALIASES[pageKey] || [pageKey];
  return aliases.some((key) => pages[key] === true);
}

export function hasPermission(
  permissions: PermissionMap | undefined,
  permissionKey: string
): boolean {
  if (!permissions) return false;
  if (permissions["*"] === true) return true;
  return permissions[permissionKey] === true;
}