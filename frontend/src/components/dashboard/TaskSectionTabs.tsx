const tabs = [
  { key: "ALL", label: "All Tasks" },
  { key: "TODAY", label: "Today" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "OVERDUE", label: "Overdue" },
] as const;

export default function TaskSectionTabs({
  active,
  onChange,
}: {
  active: "ALL" | "TODAY" | "UPCOMING" | "OVERDUE";
  onChange: (value: "ALL" | "TODAY" | "UPCOMING" | "OVERDUE") => void;
}) {
  return (
    <div className="taskTabsRow">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`taskTabBtn ${active === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}