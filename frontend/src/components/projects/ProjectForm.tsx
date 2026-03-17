import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiEdit3,
  FiFileText,
  FiFlag,
  FiFolder,
  FiSave,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import {
  ProjectPayload,
  ProjectPriority,
  ProjectRow,
  ProjectStatus,
} from "../../types/project";

const STATUS_OPTIONS: ProjectStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
];

const PRIORITY_OPTIONS: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH"];

type Props = {
  initialValue?: Partial<ProjectRow>;
  onSubmit: (payload: ProjectPayload) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function ProjectForm({
  initialValue,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save Project",
}: Props) {
  const [name, setName] = useState(initialValue?.name || "");
  const [description, setDescription] = useState(
    initialValue?.description || ""
  );
  const [status, setStatus] = useState<ProjectStatus>(
    (initialValue?.status as ProjectStatus) || "ACTIVE"
  );
  const [priority, setPriority] = useState<ProjectPriority>(
    (initialValue?.priority as ProjectPriority) || "MEDIUM"
  );
  const [startDate, setStartDate] = useState(initialValue?.start_date || "");
  const [endDate, setEndDate] = useState(initialValue?.end_date || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(initialValue?.name || "");
    setDescription(initialValue?.description || "");
    setStatus((initialValue?.status as ProjectStatus) || "ACTIVE");
    setPriority((initialValue?.priority as ProjectPriority) || "MEDIUM");
    setStartDate(initialValue?.start_date || "");
    setEndDate(initialValue?.end_date || "");
    setErrors({});
  }, [initialValue]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Project name is required";
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.end_date = "End date cannot be before start date";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      status,
      priority,
      start_date: startDate || null,
      end_date: endDate || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="uiCard uiCardBody projectForm">
      <div className="projectFormHeader">
        <div className="projectFormHeaderText">
          <div className="projectFormEyebrow">
            {initialValue?.id ? "Update project" : "Create project"}
          </div>
          <h3 className="projectFormTitle">Project Details</h3>
          <p className="projectFormSubtitle">
            Add project information, workflow status, priority, and timeline.
          </p>
        </div>

        <div className="projectFormHeaderRight">
          <div className="projectFormHeaderBadge">
            {status === "ACTIVE"
              ? "Live"
              : status === "COMPLETED"
              ? "Completed"
              : status === "ON_HOLD"
              ? "On Hold"
              : "Cancelled"}
          </div>

          {onCancel ? (
            <button
              type="button"
              className="projectModalCloseBtn"
              onClick={onCancel}
              aria-label="Close"
            >
              <FiX />
            </button>
          ) : null}
        </div>
      </div>

      <div className="projectFormGrid">
        <div className="formField formFieldFull">
          <label htmlFor="project-name">Project Name</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiFolder />
            </span>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className={errors.name ? "inputError" : ""}
            />
          </div>
          {errors.name ? <div className="fieldError">{errors.name}</div> : null}
        </div>

        <div className="formField formFieldFull">
          <label htmlFor="project-description">Description</label>
          <div className="inputWithIcon textareaWithIcon">
            <span className="inputIcon inputIconTop">
              <FiFileText />
            </span>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Write a short description about the project"
            />
          </div>
        </div>

        <div className="formField">
          <label htmlFor="project-status">Status</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiTrendingUp />
            </span>
            <select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              {STATUS_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {formatLabel(x)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="formField">
          <label htmlFor="project-priority">Priority</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiFlag />
            </span>
            <select
              id="project-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ProjectPriority)}
            >
              {PRIORITY_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {formatLabel(x)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="formField">
          <label htmlFor="project-start-date">Start Date</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiCalendar />
            </span>
            <input
              id="project-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="formField">
          <label htmlFor="project-end-date">End Date</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiEdit3 />
            </span>
            <input
              id="project-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={errors.end_date ? "inputError" : ""}
            />
          </div>
          {errors.end_date ? (
            <div className="fieldError">{errors.end_date}</div>
          ) : null}
        </div>
      </div>

      <div className="projectFormFooter">
        <div className="projectFormHint">
          Keep dates and priority updated for better tracking.
        </div>

        <div className="formActions projectFormActions">
          {onCancel ? (
            <button
              type="button"
              className="uiButton projectCancelBtn"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          ) : null}

          <button
            className="uiButton uiButtonPrimary projectSubmitBtn"
            type="submit"
            disabled={submitting}
          >
            <FiSave />
            <span>{submitting ? "Saving..." : submitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  );
}