import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiLogOut, FiShield } from "react-icons/fi";
import { useAuth } from "../auth/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import "../css/superuserLayout.css";
import { superuserSidebarItems } from "../config/sidebarItems";

export default function SuperuserLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="superShell">
      <aside className="superSidebar">
        <div className="superSidebarTop">
          <div className="superBrand">
            <div className="superBrandIcon">
              <FiShield />
            </div>
            <div className="superBrandText">
              <div className="superBrandTitle">TaskFlow Superuser</div>
              <div className="superBrandSub">{user?.name || "Superuser"}</div>
            </div>
          </div>
        </div>

        <div className="superSidebarLabel">CONTROL PANEL</div>

        <nav className="superNav">
          {superuserSidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/superuser"}
              className={({ isActive }) =>
                `superNavItem ${isActive ? "active" : ""}`
              }
            >
              <span className="superNavIcon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="superSidebarFooter">
          <button type="button" className="superLogoutBtn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="superMain">
        <div className="superTopbar">
          <div>
            <p className="superEyebrow">System Control Center</p>
            <h1 className="superMainTitle">Welcome, {user?.name || "Superuser"}</h1>
            <p className="superMainSub">
              Manage users, admins, permissions, projects, tasks, and platform activity.
            </p>
          </div>

          <div className="superTopbarActions">
            <ThemeToggle />
          </div>
        </div>

        <div className="superMainContent">
          <Outlet />
        </div>
      </main>
    </div>
  );
}