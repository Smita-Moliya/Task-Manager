import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import AddUserPage from "./pages/AddUserPage";
import AddTaskPage from "./pages/AddTaskPage";
import EditTaskPage from "./pages/EditTaskPage";

import { useAuth } from "./auth/useAuth";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AddUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/new"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AddTaskPage />
          </ProtectedRoute>
        }
      />

      {/* User Route */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allow={["USER"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* fallback */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={user.role === "ADMIN" ? "/admin" : "/user"} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
      path="/admin/tasks/:id/edit"
      element={
      <ProtectedRoute allow={["ADMIN"]}>
        <EditTaskPage />
      </ProtectedRoute>
    }
    />
    
    </Routes>

    
    

  );
}
