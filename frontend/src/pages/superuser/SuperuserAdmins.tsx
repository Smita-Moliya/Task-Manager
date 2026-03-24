import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import UserList from "../../components/UserList";
import "../../css/adminUser.css";
import { useAuth } from "../../auth/useAuth";
import { hasPermission } from "../../utils/access";

export default function SuperuserAdmins() {
  const navigate = useNavigate();
  const { permissions } = useAuth();

  const canCreateAdmin = hasPermission(permissions, "create_admin");

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
              <FiShield />
            </div>

            <div className="adminUsersTitleWrap">
              <span className="adminUsersEyebrow">Superuser Control</span>
              <h2 className="adminUsersTitle">Admins Management</h2>
              <p className="adminUsersSubtitle">
                View and manage administrator accounts from one place.
              </p>
            </div>
          </div>

          {canCreateAdmin && (
            <button
              className="adminUsersAddBtn"
              onClick={() => navigate("/superuser/admins/new")}
            >
              <FiUserPlus />
              <span>Add Admin</span>
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