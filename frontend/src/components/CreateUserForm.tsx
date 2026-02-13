import { useState } from "react";
import { api } from "../api/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

type FormValues = {
  name: string;
  email: string;
  password: string;
};

export default function CreateUserForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const validationSchema = Yup.object({
    name: Yup.string().trim().required("Name is required"),
    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Password is required"),
  });

  return (
    <Formik<FormValues>
      initialValues={{
        name: "",
        email: "",
        password: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { resetForm, setSubmitting, setErrors }) => {
        setMsg("");
        setBusy(true);

        try {
          const res = await api.post("/users/create/", {
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password,
            role: "USER",
          });

          setMsg(`User created  (id: ${res.data.user_id})`);
          resetForm();
        } catch (err: any) {
          const data = err?.response?.data;
          setMsg(data?.message || "Create failed ");

          // If backend sends field errors
          if (data?.errors && typeof data.errors === "object") {
            setErrors(data.errors);
          }
        } finally {
          setBusy(false);
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="form">
          {msg && (
            <div className={`alert ${msg.includes("User created") ? "success" : "error"}`}>
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

          <div className="field">
            <label>Password</label>
            <Field
              className="input"
              name="password"
              type="password"
            />
            <ErrorMessage name="password" component="div" className="fieldErr" />
          </div>

          <button
            className="btn primary"
            type="submit"
            disabled={busy || isSubmitting}
          >
            {busy ? "Creating..." : "Create User"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
