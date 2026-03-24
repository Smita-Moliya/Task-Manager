import { NavLink, Outlet } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import "../css/adminLayout.css";
import { FiLogOut, FiShield } from "react-icons/fi";
import { adminSidebarItems } from "../config/sidebarItems";
import { getVisibleSidebarItems } from "../utils/sidebar";

export default function AdminLayout() {
  const { user, logout, pages } = useAuth();

  const visibleNavItems = useMemo(() => {
    return getVisibleSidebarItems(adminSidebarItems, pages, user?.role === "SUPERUSER");
  }, [pages, user?.role]);

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
            <div className="adminBrandTitle">
              {user?.role === "SUPERUSER" ? "TaskFlow Super Admin" : "TaskFlow Admin"}
            </div>
            <div className="adminBrandSub">{user?.name || "Administrator"}</div>
          </div>
        </div>

        <div className="adminNavSectionLabel">Main Menu</div>

        <nav className="adminNav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `adminNavItem ${isActive ? "active" : ""}`
              }
            >
              <span className="adminNavIcon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
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
            <p className="adminEyebrow">
              {user?.role === "SUPERUSER" ? "System Control" : "Control Center"}
            </p>
            <h2 className="adminMainTitle">
              Welcome back, {user?.name || "Admin"}
            </h2>
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