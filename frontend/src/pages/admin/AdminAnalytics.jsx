import AdminCharts from "../../components/AdminCharts";
import ProjectAnalyticsPanel from "../../components/projects/ProjectAnalyticsPanel";
export default function AdminAnalytics() {
  return (
    <section className="adminCard">
      <div className="adminCardHead">
        <h3>Analytics</h3>
        <span className="adminChip">Insights</span>
      </div>
      <div className="adminCardBody">
        <AdminCharts />
        <ProjectAnalyticsPanel />
      </div>
    </section>
  );
}