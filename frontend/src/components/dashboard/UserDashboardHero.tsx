import { FiCalendar, FiSun } from "react-icons/fi";

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function UserDashboardHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="workspaceHero upgradedHero">
      <div className="workspaceHeroLeft">
        <div className="dashboardMiniBadge">
          <FiSun />
          <span>Personal Workspace</span>
        </div>

        <h1 className="workspaceTitle">{title}</h1>
        <p className="workspaceText">{subtitle}</p>

        <div className="heroMetaRow">
          <span className="heroMetaPill">
            <FiCalendar />
            {formatDate()}
          </span>
        </div>
      </div>

      <div className="heroRightBadge">
        <div className="heroRightBadgeValue">Focus</div>
        <div className="heroRightBadgeText">Plan. Track. Finish.</div>
      </div>
    </section>
  );
}