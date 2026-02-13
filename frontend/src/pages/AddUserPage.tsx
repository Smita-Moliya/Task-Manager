import { useNavigate } from "react-router-dom";
import CreateUserForm from "../components/CreateUserForm";

export default function AddUserPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h2 className="heading">Create User</h2>
        </div>

        <button className="btn" onClick={() => navigate("/admin")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <CreateUserForm />
      </div>
    </div>
  );
}
