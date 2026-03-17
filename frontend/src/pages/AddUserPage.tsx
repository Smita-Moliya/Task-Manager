import { Link } from "react-router-dom";
import CreateUserPage from "../components/CreateUserForm";
import "../css/createUser.css";
export default function CreateUserForm() {
  return (
    <div className="authPage">
      <div className="authCard wide">
        
        {/*THIS must be cardTopRow (flex header) */}
        <div className="cardTopRow">
          <div className="titleBlock">
            <h2 className="pageTitle">Create User</h2>
            <p className="pageSub">Add a user and send an invite link to set password.</p>
          </div>

          <Link to="/admin" className="btn ghost">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="cardBody">
          <CreateUserPage />
        </div>

      </div>
    </div>
  );
}
