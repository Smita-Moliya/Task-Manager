import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import AddUserPage from "./pages/AddUserPage";
import AddTaskPage from "./pages/AddTaskPage";
import SetPassword from "./pages/SetPassword";
import { useAuth } from "./auth/useAuth";
import ForgotPassword from "./pages/ForgetPassword";
import AdminLayout from "./layouts/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import UserLayout from "./layouts/UserLayout";
import { UserProvider } from "./pages/user/UserContext";
import UserTasks from "./pages/user/UserTasks";
import UserInsights from "./pages/user/UserInsights";
import UserActivity from "./pages/user/UserActivity";
import UserAttachments from "./pages/user/UserAttachments";
import UserComments from "./pages/user/UserComments";
import AdminActivityPage from "./pages/admin/AdminActivityPage";

import AdminProjects from "./pages/admin/AdminProjects";
import AdminProjectDetail from "./pages/admin/AdminProjectDetail";
import AssignProjectTaskPage from "./pages/admin/AssignProjectTaskPage";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="users" replace />} />

        <Route path="users" element={<AdminUsers />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="projects/:id" element={<AdminProjectDetail />} />
        <Route
          path="projects/:projectId/assign-task"
          element={<AssignProjectTaskPage />}
        />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="users/new" element={<AddUserPage />} />
        <Route path="tasks/new" element={<AddTaskPage />} />
      </Route>

      <Route
        path="/user"
        element={
          <ProtectedRoute allow={["USER"]}>
            <UserProvider>
              <UserLayout />
            </UserProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="tasks" replace />} />
        <Route path="tasks" element={<UserTasks />} />
        <Route path="insights" element={<UserInsights />} />
        <Route path="activity" element={<UserActivity />} />
        <Route path="attachments" element={<UserAttachments />} />
        <Route path="comments" element={<UserComments />} />
      </Route>

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
    </Routes>
  );
}