import { Link } from "react-router-dom";
import CreateUserForm from "../components/CreateUserForm";
import "../css/createUser.css";

export default function AddUserPage() {
  return (
    <div className="authPage">
      <div className="authCard wide">
        <div className="cardTopRow">
          <div className="titleBlock">
            <h2 className="pageTitle">Create User</h2>
            <p className="pageSub">
              Add a user and send an invite link to set password.
            </p>
          </div>

          <Link to="/admin/users" className="btn ghost">
            ← Back
          </Link>
        </div>

        <div className="cardBody">
          <CreateUserForm defaultRole="USER" />
        </div>
      </div>
    </div>
  );
}