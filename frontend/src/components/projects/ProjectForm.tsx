import { useMemo, useState } from "react";
import {
  FiClipboard,
  FiFileText,
  FiFlag,
  FiLayers,
  FiCalendar,
  FiX,
  FiSave,
} from "react-icons/fi";
import {
  ProjectPayload,
  ProjectPriority,
  ProjectStatus,
} from "../../types/project";
import "../../css/projectForm.css"

type ProjectFormProps = {
  onSubmit: (payload: ProjectPayload) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel?: string;
  initialValues?: Partial<ProjectPayload>;
};

type FormErrors = {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
};

export default function ProjectForm({
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save Project",
  initialValues,
}: ProjectFormProps) {
  const [form, setForm] = useState<ProjectPayload>({
    name: initialValues?.name || "",
    description: initialValues?.description ?? "",
    status: initialValues?.status || "ACTIVE",
    priority: initialValues?.priority || "MEDIUM",
    start_date: initialValues?.start_date ?? "",
    end_date: initialValues?.end_date ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  function setField<K extends keyof ProjectPayload>(
    key: K,
    value: ProjectPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const headerBadge = useMemo(() => {
    return form.status
      ? `Status: ${String(form.status).replace(/_/g, " ")}`
      : "New Project";
  }, [form.status]);

  function validate() {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Project name is required.";
    }

    if (!form.status) {
      nextErrors.status = "Status is required.";
    }

    if (!form.priority) {
      nextErrors.priority = "Priority is required.";
    }

    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);

      if (start > end) {
        nextErrors.end_date = "End date cannot be before start date.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: ProjectPayload = {
      name: form.name.trim(),
      description: form.description?.trim() ? form.description.trim() : null,
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    await onSubmit(payload);
  }

  return (
    <form className="projectForm uiCard uiCardBody" onSubmit={handleSubmit}>
      <div className="projectFormHeader">
        <div className="projectFormHeaderText">
          <div className="projectFormEyebrow">Create project</div>
          <h2 className="projectFormTitle">Project Details</h2>
          <p className="projectFormSubtitle">
            Add project information, workflow status, priority, and timeline.
          </p>
        </div>

        <div className="projectFormHeaderRight">
          <div className="projectFormHeaderBadge">{headerBadge}</div>

          <button
            type="button"
            className="projectModalCloseBtn"
            onClick={onCancel}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      <div className="projectFormGrid">
        <div className="formField">
          <label htmlFor="project-name">Project Name</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiClipboard />
            </span>
            <input
              id="project-name"
              type="text"
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={errors.name ? "inputError" : ""}
            />
          </div>
          {errors.name ? <div className="fieldError">{errors.name}</div> : null}
        </div>

        <div className="formField">
          <label htmlFor="project-status">Status</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiLayers />
            </span>
            <select
              id="project-status"
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as ProjectStatus)
              }
              className={errors.status ? "inputError" : ""}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON HOLD</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          {errors.status ? (
            <div className="fieldError">{errors.status}</div>
          ) : null}
        </div>

        <div className="formField formFieldFull">
          <label htmlFor="project-description">Description</label>
          <div className="textareaWithIcon inputWithIcon">
            <span className="inputIcon inputIconTop">
              <FiFileText />
            </span>
            <textarea
              id="project-description"
              placeholder="Write a short description about the project"
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              className={errors.description ? "inputError" : ""}
            />
          </div>
          {errors.description ? (
            <div className="fieldError">{errors.description}</div>
          ) : null}
        </div>

        <div className="formField">
          <label htmlFor="project-priority">Priority</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiFlag />
            </span>
            <select
              id="project-priority"
              value={form.priority}
              onChange={(e) =>
                setField("priority", e.target.value as ProjectPriority)
              }
              className={errors.priority ? "inputError" : ""}
            >
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          {errors.priority ? (
            <div className="fieldError">{errors.priority}</div>
          ) : null}
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
              value={form.start_date ?? ""}
              onChange={(e) => setField("start_date", e.target.value)}
              className={errors.start_date ? "inputError" : ""}
            />
          </div>
          {errors.start_date ? (
            <div className="fieldError">{errors.start_date}</div>
          ) : null}
        </div>

        <div className="formField">
          <label htmlFor="project-end-date">End Date</label>
          <div className="inputWithIcon">
            <span className="inputIcon">
              <FiCalendar />
            </span>
            <input
              id="project-end-date"
              type="date"
              value={form.end_date ?? ""}
              onChange={(e) => setField("end_date", e.target.value)}
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

        <div className="projectFormActions">
          <button
            type="button"
            className="projectCancelBtn"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="uiButton uiButtonPrimary projectSubmitBtn"
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