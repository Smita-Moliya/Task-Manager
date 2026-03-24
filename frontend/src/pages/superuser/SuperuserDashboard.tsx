import {
  FiShield,
  FiUsers,
  FiUserCheck,
  FiFolder,
  FiCheckSquare,
  FiActivity,
  FiKey,
  FiArrowRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import "../../css/superuserDashboard.css";

const quickStats = [
  {
    title: "Total Users",
    value: "All",
    note: "Manage every registered platform user",
    icon: <FiUsers />,
  },
  {
    title: "Admins",
    value: "All",
    note: "Create and control admin accounts",
    icon: <FiUserCheck />,
  },
  {
    title: "Projects",
    value: "All",
    note: "Monitor all projects across the system",
    icon: <FiFolder />,
  },
  {
    title: "Tasks",
    value: "All",
    note: "Track platform-wide task execution",
    icon: <FiCheckSquare />,
  },
];

const controlCards = [
  {
    title: "Users Management",
    text: "View all users, create new users, and manage account access.",
    icon: <FiUsers />,
    to: "/superuser/users",
    cta: "Manage Users",
  },
  {
    title: "Admins Management",
    text: "Create admins and supervise elevated access across the platform.",
    icon: <FiUserCheck />,
    to: "/superuser/admins",
    cta: "Manage Admins",
  },
  {
    title: "Access Control",
    text: "Grant, revoke, and control page-level access and privileges.",
    icon: <FiKey />,
    to: "/superuser/access-control",
    cta: "Open Access Control",
  },
  {
    title: "System Activity",
    text: "Review platform-wide logs, actions, and management history.",
    icon: <FiActivity />,
    to: "/superuser/activity",
    cta: "View Activity",
  },
];

export default function SuperuserDashboard() {
  return (
    <section className="superDashboardPage">
      <div className="superDashboardHero">
        <div className="superDashboardHeroContent">
          <div className="superDashboardBadge">
            <FiShield />
            <span>Superuser Control Center</span>
          </div>

          <h1 className="superDashboardTitle">Welcome to the Superuser Dashboard</h1>

          <p className="superDashboardText">
            Manage admins, users, access rights, projects, tasks, and activity from one
            central control panel built for full platform oversight.
          </p>

          <div className="superDashboardHeroActions">
            <Link to="/superuser/users" className="superDashboardPrimaryBtn">
              <FiUsers />
              <span>Manage Users</span>
            </Link>

            <Link to="/superuser/access-control" className="superDashboardGhostBtn">
              <FiKey />
              <span>Access Control</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="superStatsGrid">
        {quickStats.map((item) => (
          <div key={item.title} className="superStatCard">
            <div className="superStatTop">
              <div className="superStatIcon">{item.icon}</div>
              <div className="superStatValue">{item.value}</div>
            </div>

            <h3 className="superStatTitle">{item.title}</h3>
            <p className="superStatNote">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="superSectionHeader">
        <div>
          <p className="superSectionEyebrow">System Modules</p>
          <h2 className="superSectionTitle">Manage Everything From Here</h2>
        </div>
      </div>

      <div className="superControlGrid">
        {controlCards.map((card) => (
          <div key={card.title} className="superControlCard">
            <div className="superControlIcon">{card.icon}</div>
            <h3 className="superControlTitle">{card.title}</h3>
            <p className="superControlText">{card.text}</p>

            <Link to={card.to} className="superControlLink">
              <span>{card.cta}</span>
              <FiArrowRight />
            </Link>
          </div>
        ))}
      </div>

      <div className="superBottomGrid">
        <div className="superInfoCard">
          <p className="superSectionEyebrow">High-Level Authority</p>
          <h3 className="superInfoTitle">What the superuser can do</h3>
          <ul className="superInfoList">
            <li>Create and manage admin accounts</li>
            <li>Control user and admin access</li>
            <li>Grant and revoke permissions</li>
            <li>Oversee all tasks and projects</li>
            <li>Monitor activity across the platform</li>
          </ul>
        </div>

        <div className="superInfoCard">
          <p className="superSectionEyebrow">Quick Navigation</p>
          <h3 className="superInfoTitle">Open a management area</h3>

          <div className="superQuickLinks">
            <Link to="/superuser/users" className="superQuickLink">
              <FiUsers />
              <span>Users</span>
            </Link>

            <Link to="/superuser/admins" className="superQuickLink">
              <FiUserCheck />
              <span>Admins</span>
            </Link>

            <Link to="/superuser/projects" className="superQuickLink">
              <FiFolder />
              <span>Projects</span>
            </Link>

            <Link to="/superuser/tasks" className="superQuickLink">
              <FiCheckSquare />
              <span>Tasks</span>
            </Link>

            <Link to="/superuser/activity" className="superQuickLink">
              <FiActivity />
              <span>Activity</span>
            </Link>

            <Link to="/superuser/access-control" className="superQuickLink">
              <FiKey />
              <span>Access</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}