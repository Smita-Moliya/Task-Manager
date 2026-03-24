import React from "react";

type StatItem = {
  label: string;
  value: number;
  icon: React.ReactNode;
  helper: string;
  tone?: "neutral" | "warning" | "danger" | "info" | "success";
};

export default function UserStatsOverview({ items }: { items: StatItem[] }) {
  return (
    <section className="statsGrid">
      {items.map((item) => (
        <article
          key={item.label}
          className={`statCard tone-${item.tone || "neutral"}`}
        >
          <div className="statCardTop">
            <div className="statIcon">{item.icon}</div>
            <div className="statLabel">{item.label}</div>
          </div>

          <div className="statValue">{item.value}</div>
          <div className="statHelper">{item.helper}</div>
        </article>
      ))}
    </section>
  );
}