import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import "../css/adminLayout.css";
import {
  FiUsers,
  FiCheckSquare,
  FiBarChart2,
  FiFileText,
  FiLogOut,
  FiShield,
  FiFolder,
} from "react-icons/fi";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="adminShell">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <div className="adminLogoWrap">
            <div className="adminLogo">
              <FiShield size={18} />
            </div>
          </div>

          <div className="adminBrandText">
            <div className="adminBrandTitle">TaskFlow Admin</div>
            <div className="adminBrandSub">{user?.name || "Administrator"}</div>
          </div>
        </div>

        <div className="adminNavSectionLabel">Main Menu</div>

        <nav className="adminNav">
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `adminNavItem ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon"><FiUsers size={18} /></span>
            <span>Users</span>
          </NavLink>

          <NavLink
            to="/admin/projects"
            className={({ isActive }) => `adminNavItem ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon"><FiFolder size={18} /></span>
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/admin/tasks"
            className={({ isActive }) => `adminNavItem ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon"><FiCheckSquare size={18} /></span>
            <span>Tasks</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) => `adminNavItem ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon"><FiBarChart2 size={18} /></span>
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/activity"
            className={({ isActive }) => `adminNavItem ${isActive ? "active" : ""}`}
          >
            <span className="adminNavIcon"><FiFileText size={18} /></span>
            <span>Activity Logs</span>
          </NavLink>
        </nav>

        <div className="adminSidebarFooter">
          <button className="adminSideBtn ghost" onClick={logout}>
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="adminMain">
        <div className="adminMainTop">
          <div>
            <p className="adminEyebrow">Control Center</p>
            <h2 className="adminMainTitle">Welcome back, {user?.name || "Admin"}</h2>
            <p className="adminMainSub">
              Manage users, projects, tasks, activity, and platform insights from one place.
            </p>
          </div>

          <div className="adminTopActions">
            <ThemeToggle />
          </div>
        </div>

        <div className="adminMainContent">
          <Outlet />
        </div>
      </main>
    </div>
  );
}