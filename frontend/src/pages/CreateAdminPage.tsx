import { Link } from "react-router-dom";
import CreateUserForm from "../components/CreateUserForm";
import "../css/createUser.css";

export default function CreateAdminPage() {
  return (
    <div className="authPage">
      <div className="authCard wide">
        <div className="cardTopRow">
          <div className="titleBlock">
            <h2 className="pageTitle">Create Admin</h2>
            <p className="pageSub">
              Add an admin and send an invite link to set password.
            </p>
          </div>

          <Link to="/superuser/admins" className="btn ghost">
            ← Back
          </Link>
        </div>

        <div className="cardBody">
          <CreateUserForm defaultRole="ADMIN" />
        </div>
      </div>
    </div>
  );
}