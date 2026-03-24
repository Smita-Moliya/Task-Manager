import { useState } from "react";
import { api } from "../api/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { FormValues, MsgType } from "../types/form";

type CreateUserFormProps = {
  defaultRole?: "USER" | "ADMIN";
};

function normalizeFieldErrors(
  data: any
): Partial<Record<keyof FormValues, string>> {
  const src = data?.errors && typeof data.errors === "object" ? data.errors : data;
  const out: Partial<Record<keyof FormValues, string>> = {};

  for (const key of ["name", "email"] as (keyof FormValues)[]) {
    const val = src?.[key];
    if (!val) continue;
    out[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : String(val);
  }

  return out;
}

function pickTopMessage(data: any): string {
  return (
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.non_field_errors?.[0] ||
    ""
  );
}

export default function CreateUserForm({
  defaultRole = "USER",
}: CreateUserFormProps) {
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("");
  const [creating, setCreating] = useState(false);

  const normalizedRole = defaultRole === "ADMIN" ? "ADMIN" : "USER";
  const isAdmin = normalizedRole === "ADMIN";

  const validationSchema = Yup.object({
    name: Yup.string().trim().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  return (
    <Formik<FormValues>
      initialValues={{ name: "", email: "" }}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm, setSubmitting, setErrors }) => {
        setMsg("");
        setMsgType("");

        const payload = {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: normalizedRole,
        };

        setCreating(true);

        try {
          const res = await api.post("/users/create/", payload);
          setMsg(
            res.data?.message ||
              `${isAdmin ? "Admin" : "User"} created. Link sent to email.`
          );
          setMsgType("success");
          resetForm();
        } catch (err: any) {
          const status = err?.response?.status;
          const data = err?.response?.data;

          const fieldErrors = normalizeFieldErrors(data);
          if (Object.keys(fieldErrors).length) {
            setErrors(fieldErrors);
          }

          if (status === 409) {
            setMsg(
              pickTopMessage(data) ||
                `${isAdmin ? "Admin" : "User"} already exists.`
            );
            setMsgType("warning");
            return;
          }

          setMsg(pickTopMessage(data) || "Create failed");
          setMsgType("error");
        } finally {
          setCreating(false);
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="form createUserForm">
          <div className="infoBanner createUserBanner">
            <span className="pill rolePillFixed">Role: {normalizedRole}</span>
            <div className="bannerText">
              <span className="hint">
                Invite link will be emailed to set password.
              </span>
            </div>
          </div>

          {msg && (
            <div className={`alert ${msgType || "error"} createUserAlert`}>
              {msg}
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="name">
              Full Name
            </label>
            <Field
              id="name"
              className="input createUserInput"
              name="name"
              placeholder="e.g. Smita Moliya"
            />
            <ErrorMessage name="name" component="div" className="fieldErr" />
          </div>

          <div className="field">
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <Field
              id="email"
              className="input createUserInput"
              name="email"
              type="email"
              placeholder="user@example.com"
            />
            <ErrorMessage name="email" component="div" className="fieldErr" />
          </div>

          <button
            className="btn primary btnFull createUserBtn"
            type="submit"
            disabled={creating || isSubmitting}
          >
            {creating || isSubmitting
              ? "Creating..."
              : isAdmin
              ? "Create Admin"
              : "Create User"}
          </button>
        </Form>
      )}
    </Formik>
  );
}