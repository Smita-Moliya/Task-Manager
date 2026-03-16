import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";

export default function Login() {
  const { login, access, user } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");

  // keep your old auto-redirect logic (important)
  useEffect(() => {
    if (access && user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/user", { replace: true });
    }
  }, [access, user, navigate]);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string()
    .min(8, "Min 8 characters")
    .matches(/[A-Z]/, "Must contain atleast one uppercase")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
    .required("Password required"),
  });

  

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Task Management System</h1>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          validateOnChange={false}
          validateOnBlur={false}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setApiError(""); // clear only when user submits again

            try {
              const res = await api.post("/auth/login/", {
                email: values.email.trim(),
                password: values.password,
              });

              // expected: { token, user: {id,name,email,role} }
              login(res.data.access, res.data.refresh, res.data.user);

              // ✅ optional immediate redirect (useEffect will also do it)
              navigate(res.data.user.role === "ADMIN" ? "/admin" : "/user", {
                replace: true,
              });
            } catch (err: any) {
              if (axios.isAxiosError(err)) {
                setStatus(err.response?.data?.message || "Invalid email or password");
              } else {
                setStatus("Login failed");
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="form">
              {status && <div className="alert error">{status}</div>}

              <div className="field">
                <label>Email</label>
                <Field 
                className="input" 
                name="email" 
                type="email"
                autoComplete="off"
                placeholder="Enter email" />
                <ErrorMessage name="email" component="div" className="fieldErr" />
              </div>

              <div className="field">
                <label>Password</label>
                <Field
                  className="input"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <ErrorMessage name="password" component="div" className="fieldErr" />
              </div>

              <button type='submit' className="btn primary" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
