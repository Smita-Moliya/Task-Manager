import { useEffect, useState } from "react";
import { api } from "../api/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

type User = { id: number; name: string; email: string; role: "ADMIN" | "USER" };

type FormValues = {
  title: string;
  assignedTo: number | "";
  dueDate: string;
  description: string;
  files: File[]; // ✅ NEW
};

export default function TaskCreateForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get("/users/");
      const all: User[] = res.data.users || [];
      setUsers(all.filter((u) => u.role === "USER"));
    })();
  }, []);

  const validationSchema = Yup.object({
    title: Yup.string().trim().required("Title is required"),
    assignedTo: Yup.mixed<number | "">().test(
      "assignedTo",
      "Please select a user",
      (val) => val !== ""
    ),
    dueDate: Yup.string(),
    description: Yup.string(),
    files: Yup.array().of(Yup.mixed<File>()).max(5, "Max 5 files allowed"), // ✅ optional rule
  });

  const initialValues: FormValues = {
    title: "",
    assignedTo: "",
    dueDate: "",
    description: "",
    files: [], // ✅ NEW
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm, setSubmitting }) => {
        setMsg("");
        setBusy(true);

        try {
          // ✅ multipart/form-data
          const fd = new FormData();
          fd.append("title", values.title.trim());
          fd.append("description", values.description.trim());
          fd.append("assigned_to", String(values.assignedTo));
          fd.append("due_date", values.dueDate || "");

          values.files.forEach((f) => fd.append("files", f));

          await api.post("/tasks/", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          resetForm();
          setMsg("Task created + email sent ✅");
        } catch (err: any) {
          setMsg(err?.response?.data?.message || "Create failed ❌");
        } finally {
          setBusy(false);
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="form">
          {msg && (
            <div className={`alert ${msg.includes("✅") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <div className="field">
            <label>Title</label>
            <Field className="input" name="title" />
            <ErrorMessage name="title" component="div" className="fieldErr" />
          </div>

          <div className="field">
            <label>Assign To</label>
            <select
              className="input"
              value={values.assignedTo}
              onChange={(e) => {
                const v = e.target.value;
                setFieldValue("assignedTo", v === "" ? "" : Number(v));
              }}
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <ErrorMessage name="assignedTo" component="div" className="fieldErr" />
          </div>

          <div className="field">
            <label>Due Date</label>
            <Field className="input" type="date" name="dueDate" />
          </div>

          <div className="field">
            <label>Description</label>
            <Field as="textarea" className="input textarea" name="description" />
          </div>

          {/* ✅ NEW: file upload */}
          <div className="field">
            <label>Attach Documents</label>
            <input
              className="input"
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.currentTarget.files || []);
                setFieldValue("files", files);
              }}
            />
            {/* optional: show chosen files */}
            {values.files.length > 0 && (
              <div className="muted small" style={{ marginTop: 6 }}>
                Selected: {values.files.map((f) => f.name).join(", ")}
              </div>
            )}
            <ErrorMessage name="files" component="div" className="fieldErr" />
          </div>

          <button className="btn primary" type="submit" disabled={busy || isSubmitting}>
            {busy ? "Creating..." : "Create Task"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
