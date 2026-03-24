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
import UserProjects from "./pages/user/UserProjects";
import UserProjectDetails from "./pages/user/UserProjectDetails";
import SuperuserLayout from "./layouts/SuperuserLayout";
import SuperuserDashboard from "./pages/superuser/SuperuserDashboard";
import SuperuserAdmins from "./pages/superuser/SuperuserAdmins";
import CreateAdminPage from "./pages/CreateAdminPage";
import AccessControlPage from "./pages/superuser/AccessControlPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { getFirstAllowedRoute } from "./utils/routeAccess";


type AppRouteConfig = {
  path?: string;
  index?: boolean;
  pageKey?: string;
  permission?: string;
  element: React.ReactNode;
};

const adminRoutes: AppRouteConfig[] = [
  {
    index: true,
    element: <AdminDefaultRedirect />,
  },
  {
    path: "dashboard",
    pageKey: "admin.dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "users",
    pageKey: "admin.users",
    element: <AdminUsers />,
  },
  {
    path: "projects",
    pageKey: "admin.projects",
    element: <AdminProjects />,
  },
  {
    path: "projects/:id",
    pageKey: "admin.projects",
    element: <AdminProjectDetail />,
  },
  {
    path: "projects/:projectId/assign-task",
    permission: "create_task",
    element: <AssignProjectTaskPage />,
  },
  {
    path: "tasks",
    pageKey: "admin.tasks",
    element: <AdminTasks />,
  },
  {
    path: "analytics",
    pageKey: "admin.analytics",
    element: <AdminAnalytics />,
  },
  {
    path: "activity",
    pageKey: "admin.activity",
    element: <AdminActivityPage />,
  },
  {
    path: "users/new",
    permission: "create_user",
    element: <AddUserPage />,
  },
  {
    path: "tasks/new",
    permission: "create_task",
    element: <AddTaskPage />,
  },
];

const userRoutes: AppRouteConfig[] = [
  {
    index: true,
    element: <UserDefaultRedirect />,
  },
  {
    path: "insights",
    pageKey: "user.insights",
    element: <UserInsights />,
  },
  {
    path: "projects",
    pageKey: "user.projects",
    element: <UserProjects />,
  },
  {
    path: "projects/:projectId",
    pageKey: "user.projects",
    element: <UserProjectDetails />,
  },
  {
    path: "tasks",
    pageKey: "user.tasks",
    element: <UserTasks />,
  },
  {
    path: "activity",
    pageKey: "user.activity",
    element: <UserActivity />,
  },
  {
    path: "attachments",
    pageKey: "user.attachments",
    element: <UserAttachments />,
  },
  {
    path: "comments",
    pageKey: "user.comments",
    element: <UserComments />,
  },
];

function renderProtectedRoute(route: AppRouteConfig, key: string) {
  if (route.index) {
    return <Route key={key} index element={route.element} />;
  }

  const wrappedElement =
    route.pageKey || route.permission ? (
      <ProtectedRoute pageKey={route.pageKey} permission={route.permission}>
        {route.element}
      </ProtectedRoute>
    ) : (
      route.element
    );

  return <Route key={key} path={route.path} element={wrappedElement} />;
}
function AdminDefaultRedirect() {
  const { user, pages } = useAuth();
  return <Navigate to={getFirstAllowedRoute(user?.role, pages)} replace />;
}

function UserDefaultRedirect() {
  const { user, pages } = useAuth();
  return <Navigate to={getFirstAllowedRoute(user?.role, pages)} replace />;
}
export default function App() {
  const { user, pages } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/superuser"
        element={
          <ProtectedRoute allow={["SUPERUSER"]}>
            <SuperuserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperuserDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/new" element={<AddUserPage />} />
        <Route path="admins" element={<SuperuserAdmins />} />
        <Route path="admins/new" element={<CreateAdminPage />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="access-control" element={<AccessControlPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {adminRoutes.map((route, index) =>
          renderProtectedRoute(route, `admin-${route.path ?? "index"}-${index}`)
        )}
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
        {userRoutes.map((route, index) =>
          renderProtectedRoute(route, `user-${route.path ?? "index"}-${index}`)
        )}
      </Route>

      <Route
        path="*"
        element={
          user ? (
            <Navigate to={getFirstAllowedRoute(user.role, pages)} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}