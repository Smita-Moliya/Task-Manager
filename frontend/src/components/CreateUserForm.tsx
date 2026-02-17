import { useState } from "react";
import { api } from "../api/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

type FormValues = {
  name: string;
  email: string;
};

export default function CreateUserForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const validationSchema = Yup.object({
    name: Yup.string().trim().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const sendReset = async () => {
    setMsg("");
    setBusy(true);
    try {
      const res = await api.post("/auth/send-reset-link/", { email: lastEmail });
      setMsg(res.data?.message || "Reset link sent to email.");
      setShowReset(false);
    } catch (err: any) {
      const data = err?.response?.data;
      setMsg(data?.error || data?.message || "Failed to send reset link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Formik<FormValues>
      initialValues={{ name: "", email: "" }}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm, setSubmitting, setErrors }) => {
        setMsg("");
        setShowReset(false);
        setBusy(true);

        const payload = {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: "USER",
        };

        try {
          const res = await api.post("/users/create/", payload);

          setMsg(res.data?.message || "User created. Link sent to email.");
          resetForm();
        } catch (err: any) {
          const status = err?.response?.status;
          const data = err?.response?.data;

          // backend field errors (if any)
          if (data?.errors && typeof data.errors === "object") {
            setErrors(data.errors);
          }

          // ✅ handle "user exists" (409)
          if (status === 409) {
            setMsg(data?.message || "User already exists. Want to reset password?");
            setShowReset(true);
            setLastEmail(payload.email);
            return;
          }

          setMsg(data?.error || data?.message || "Create failed");
        } finally {
          setBusy(false);
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="form">
          {msg && (
            <div className={`alert ${showReset ? "warning" : msg.includes("Link") || msg.includes("created") ? "success" : "error"}`}>
              {msg}
            </div>
          )}

          <div className="field">
            <label>Name</label>
            <Field className="input" name="name" />
            <ErrorMessage name="name" component="div" className="fieldErr" />
          </div>

          <div className="field">
            <label>Email</label>
            <Field className="input" name="email" />
            <ErrorMessage name="email" component="div" className="fieldErr" />
          </div>

          <button className="btn primary" type="submit" disabled={busy || isSubmitting}>
            {busy ? "Sending..." : "Create User + Send Link"}
          </button>

          {showReset && (
            <button
              className="btn secondary"
              type="button"
              onClick={sendReset}
              disabled={busy}
              style={{ marginTop: 10 }}
            >
              {busy ? "Sending..." : "Send Reset Password Link"}
            </button>
          )}
        </Form>
      )}
    </Formik>
  );
}
