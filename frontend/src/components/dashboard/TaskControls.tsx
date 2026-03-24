import { FiFilter, FiSearch } from "react-icons/fi";
import { Filters } from "../../types/dashboard";

export default function TaskControls({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  return (
    <div className="taskControls taskControlsInline upgradedTaskControls">
      <div className="taskSearchWrap">
        <FiSearch className="taskSearchIcon" />
        <input
          className="uiInput taskControlsInput upgradedInput"
          placeholder="Search by task title or description..."
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
        />
      </div>

      <div className="taskFilterWrap">
        <FiFilter className="taskFilterIcon" />
        <select
          className="uiSelect taskControlsSelect"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as any })}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        <select
          className="uiSelect taskControlsSelect"
          value={value.due}
          onChange={(e) => onChange({ ...value, due: e.target.value as any })}
        >
          <option value="ALL">All Due</option>
          <option value="TODAY">Due Today</option>
          <option value="THIS_WEEK">Due This Week</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        <select
          className="uiSelect taskControlsSelect"
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as any })}
        >
          <option value="DUE_SOON">Due Soon</option>
          <option value="NEWEST">Newest</option>
          <option value="STATUS">Status</option>
        </select>
      </div>
    </div>
  );
}