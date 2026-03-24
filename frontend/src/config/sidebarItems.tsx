import React from "react";
import {
  FiGrid,
  FiUsers,
  FiFolder,
  FiCheckSquare,
  FiBarChart2,
  FiActivity,
  FiMessageSquare,
  FiPaperclip,
  FiTrendingUp,
  FiFileText,
  FiUserCheck,
  FiKey,
} from "react-icons/fi";

export type SidebarItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
  pageKey?: string;
};

export const adminSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: <FiGrid size={18} />,
    pageKey: "admin.dashboard",
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: <FiUsers size={18} />,
    pageKey: "admin.users",
  },
  {
    label: "Projects",
    to: "/admin/projects",
    icon: <FiFolder size={18} />,
    pageKey: "admin.projects",
  },
  {
    label: "Tasks",
    to: "/admin/tasks",
    icon: <FiCheckSquare size={18} />,
    pageKey: "admin.tasks",
  },
  {
    label: "Analytics",
    to: "/admin/analytics",
    icon: <FiBarChart2 size={18} />,
    pageKey: "admin.analytics",
  },
  {
    label: "Activity Logs",
    to: "/admin/activity",
    icon: <FiFileText size={18} />,
    pageKey: "admin.activity",
  },
  
 
];

export const userSidebarItems: SidebarItem[] = [
  {
    label: "Insights",
    to: "/user/insights",
    icon: <FiTrendingUp />,
    pageKey: "user.insights",
  },
  {
    label: "Projects",
    to: "/user/projects",
    icon: <FiFolder />,
    pageKey: "user.projects",
  },
  {
    label: "My Tasks",
    to: "/user/tasks",
    icon: <FiCheckSquare />,
    pageKey: "user.tasks",
  },
  {
    label: "Activity",
    to: "/user/activity",
    icon: <FiActivity />,
    pageKey: "user.activity",
  },
  {
    label: "Attachments",
    to: "/user/attachments",
    icon: <FiPaperclip />,
    pageKey: "user.attachments",
  },
  {
    label: "Comments",
    to: "/user/comments",
    icon: <FiMessageSquare />,
    pageKey: "user.comments",
  },
];

export const superuserSidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    to: "/superuser",
    icon: <FiGrid />,
  },
  {
    label: "Users",
    to: "/superuser/users",
    icon: <FiUsers />,
  },
  {
    label: "Admins",
    to: "/superuser/admins",
    icon: <FiUserCheck />,
  },
  {
    label: "Projects",
    to: "/superuser/projects",
    icon: <FiFolder />,
  },
  {
    label: "Tasks",
    to: "/superuser/tasks",
    icon: <FiCheckSquare />,
  },
  {
    label: "Activity",
    to: "/superuser/activity",
    icon: <FiActivity />,
  },
  {
    label: "Access Control",
    to: "/superuser/access-control",
    icon: <FiKey />,
  },
];