import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiUserPlus,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import UserList from "../../components/UserList";
import "../../css/adminUser.css";
import { useAuth } from "../../auth/useAuth";
import { hasPermission } from "../../utils/access";

export default function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();

  const { permissions, user } = useAuth();

  const isSuperuserAdminsPage = location.pathname.startsWith("/superuser/admins");
  const isSuperuserUsersPage = location.pathname.startsWith("/superuser/users");
  const isAdminUsersPage = location.pathname.startsWith("/admin/users");

  const isAdminPage = location.pathname.startsWith("/admin");

  //  Page type
  const pageType = isSuperuserAdminsPage
    ? "ADMIN"
    : "USER";

  //  Permissions
  const canCreateUser = hasPermission(permissions, "create_user");
  const canCreateAdmin = hasPermission(permissions, "create_admin");

  const canCreate =
    pageType === "ADMIN" ? canCreateAdmin : canCreateUser;

  //  UI Labels
  const title =
    pageType === "ADMIN" ? "Admins Management" : "Users Management";

  const subtitle =
    pageType === "ADMIN"
      ? "Manage system administrators and access control."
      : "View, manage, and add users from one place.";

  const addLabel =
    pageType === "ADMIN" ? "Add Admin" : "Add User";

  const icon =
    pageType === "ADMIN" ? <FiShield /> : <FiUsers />;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const startItem = totalPages > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalPages * pageSize);

  return (
    <section className="adminUsersPage">
      <div className="adminUsersCard">
        <div className="adminUsersHeader">
          <div className="adminUsersHeaderLeft">
            <div className="adminUsersIconWrap">
              {icon}
            </div>

            <div className="adminUsersTitleWrap">
              <span className="adminUsersEyebrow">Administration</span>
              <h2 className="adminUsersTitle">{title}</h2>
              <p className="adminUsersSubtitle">{subtitle}</p>
            </div>
          </div>

          {canCreate && (
            <button
              className="adminUsersAddBtn"
              onClick={() =>
                navigate(`/admin/users/new?role=${pageType}`)
              }
            >
              <FiUserPlus />
              <span>{addLabel}</span>
            </button>
          )}
        </div>

        <div className="adminUsersToolbar">
          <div className="adminUsersMeta">
            <span className="adminUsersMetaLabel">Showing</span>
            <strong>
              {startItem}-{endItem}
            </strong>
            <span className="adminUsersMetaLabel">entries</span>
          </div>

          <div className="adminUsersPageBadge">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </div>
        </div>

        <div className="adminUsersBody">
          <UserList
            page={page}
            pageSize={pageSize}
            onTotalPages={setTotalPages}
          />
        </div>

        <div className="adminUsersPagination">
          <button
            className="adminUsersPageBtn"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            <FiChevronLeft />
            <span>Previous</span>
          </button>

          <div className="adminUsersPaginationInfo">
            <span className="adminUsersPaginationText">Current Page</span>
            <strong>{page}</strong>
          </div>

          <button
            className="adminUsersPageBtn"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            <span>Next</span>
            <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}