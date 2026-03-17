import { useState } from "react";
import UserList from "../../components/UserList";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const navigate = useNavigate();

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  return (
    <section className="adminCard">
      <div className="adminCardHead">
        <div className="tmTitle">
          <h3 style={{ margin: 0 }}>Users</h3>
        </div>

        <span>
          <button className="adminSideBtn" onClick={() => navigate("/admin/users/new")}>
            + Add User
          </button>
        </span>
      </div>

      <div className="adminCardBody">
        {/*  pass pagination props to UserList */}
        <UserList
          page={page}
          pageSize={pageSize}
          onTotalPages={setTotalPages} // UserList will call this after API response
        />
      </div>

      <div className="pg">
        <button
          className="pgBtn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>

        <span className="pgInfo">
          Page {page} / {totalPages}
        </span>

        <button
          className="pgBtn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

    </section>
  );
}

