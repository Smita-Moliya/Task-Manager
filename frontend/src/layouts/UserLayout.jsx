import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../auth/useAuth";
import "../css/userLayout.css";
import { userSidebarItems } from "../config/sidebarItems";
import { getVisibleSidebarItems } from "../utils/sidebar";

export default function UserLayout() {
  const { logout, user, pages } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const visibleNavItems = getVisibleSidebarItems(userSidebarItems, pages);

  return (
    <div className="userShell">
      <aside className="userSidebar">
        <div className="userSidebarHeader">
          <div className="userSidebarProfile">
            <div className="userSidebarAvatar">
              <FiUser />
            </div>
            <div>
              <div className="userSidebarBrand">TaskFlow User</div>
              <div className="userSidebarName">{user?.name || "User"}</div>
            </div>
          </div>
        </div>

        <div className="userSidebarSectionTitle">WORKSPACE</div>

        <nav className="userSidebarNav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `userSidebarLink ${isActive ? "active" : ""}`
              }
            >
              <span className="userSidebarLinkIcon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="userSidebarFooter">
          <button
            type="button"
            className="userSidebarLogout"
            onClick={handleLogout}
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </aside>

      <main className="userMain">
        <Outlet />
      </main>
    </div>
  );
}