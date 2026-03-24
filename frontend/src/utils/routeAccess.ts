import { PageAccessMap, Role } from "../types/authType";

const adminRouteOrder = [
  { pageKey: "admin.dashboard", path: "/admin/dashboard" },
  { pageKey: "admin.users", path: "/admin/users" },
  { pageKey: "admin.projects", path: "/admin/projects" },
  { pageKey: "admin.tasks", path: "/admin/tasks" },
  { pageKey: "admin.analytics", path: "/admin/analytics" },
  { pageKey: "admin.activity", path: "/admin/activity" },
];

const userRouteOrder = [
  { pageKey: "user.insights", path: "/user/insights" },
  { pageKey: "user.tasks", path: "/user/tasks" },
  { pageKey: "user.projects", path: "/user/projects" },
  { pageKey: "user.activity", path: "/user/activity" },
];

export function getFirstAllowedRoute(
  role?: Role | string,
  pages: PageAccessMap = {}
): string {
  if (role === "SUPERUSER") return "/superuser";

  if (role === "ADMIN") {
    const found = adminRouteOrder.find((item) => pages[item.pageKey]);
    return found ? found.path : "/admin/dashboard"; // fallback
  }

  if (role === "USER") {
    const found = userRouteOrder.find((item) => pages[item.pageKey]);
    return found ? found.path : "/user/insights"; // fallback
  }

  return "/";
}