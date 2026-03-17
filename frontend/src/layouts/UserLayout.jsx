import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import {
  FiCheckSquare,
  FiBarChart2,
  FiClock,
  FiPaperclip,
  FiMessageSquare,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import "../css/userLayout.css";

export default function UserLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="userShell">
      <aside className="userSidebar">
        <div className="userBrand">
          <div className="userLogo">
            <FiUser size={18} />
          </div>

          <div className="userBrandText">
            <div className="userBrandTitle">TaskFlow User</div>
            <div className="userBrandSub">{user?.name || "User"}</div>
          </div>
        </div>

        <div className="userNavSectionLabel">Main Menu</div>

        <nav className="userNav">
          <NavLink
            to="/user/tasks"
            className={({ isActive }) => `userNavItem ${isActive ? "active" : ""}`}
          >
            <span className="userNavIcon"><FiCheckSquare size={18} /></span>
            <span>Tasks</span>
          </NavLink>

          <NavLink
            to="/user/insights"
            className={({ isActive }) => `userNavItem ${isActive ? "active" : ""}`}
          >
            <span className="userNavIcon"><FiBarChart2 size={18} /></span>
            <span>Insights</span>
          </NavLink>

          <NavLink
            to="/user/activity"
            className={({ isActive }) => `userNavItem ${isActive ? "active" : ""}`}
          >
            <span className="userNavIcon"><FiClock size={18} /></span>
            <span>Activity</span>
          </NavLink>

          <NavLink
            to="/user/attachments"
            className={({ isActive }) => `userNavItem ${isActive ? "active" : ""}`}
          >
            <span className="userNavIcon"><FiPaperclip size={18} /></span>
            <span>Attachments</span>
          </NavLink>

          <NavLink
            to="/user/comments"
            className={({ isActive }) => `userNavItem ${isActive ? "active" : ""}`}
          >
            <span className="userNavIcon"><FiMessageSquare size={18} /></span>
            <span>Comments</span>
          </NavLink>
        </nav>

        <div className="userSidebarFooter">
          <button className="userSideBtn ghost" onClick={logout}>
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
              Manage tasks, activity, and platform insights from one place.
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