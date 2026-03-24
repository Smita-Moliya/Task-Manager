import { useState } from "react";
import AdminCharts from "../../components/AdminCharts";
import ProjectAnalyticsPanel from "../../components/projects/ProjectAnalyticsPanel";
import "../../css/analytics.css";

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="analyticsWorkspace">
      <div className="analyticsWorkspaceHero">
        <div>
          <div className="analyticsWorkspaceEyebrow">WORKSPACE</div>
          <h1 className="analyticsWorkspaceTitle">Analytics Dashboard</h1>
          <p className="analyticsWorkspaceSubtitle">
            Monitor overall platform insights and project analytics.
          </p>
        </div>
      </div>

      <div className="analyticsSectionTabs">
        <button
          className={`analyticsTabBtn ${
            activeTab === "overview" ? "active" : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Task Analytics
        </button>

        <button
          className={`analyticsTabBtn ${
            activeTab === "projects" ? "active" : ""
          }`}
          onClick={() => setActiveTab("projects")}
        >
          Project Analytics
        </button>
      </div>

      {activeTab === "overview" && <AdminCharts />}
      {activeTab === "projects" && <ProjectAnalyticsPanel />}
    </section>
  );
}