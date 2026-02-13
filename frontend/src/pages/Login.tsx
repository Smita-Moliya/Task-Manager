import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

export default function Login() {
  const { login, token, user } = useAuth();
  const navigate = useNavigate();

  // ✅ keep your old auto-redirect logic (important)
  useEffect(() => {
    if (token && user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/user", { replace: true });
    }
  }, [token, user, navigate]);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string().min(4, "Min 4 characters").required("Password required"),
  });

  

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Task System</h1>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            setStatus("");
            try {
              const res = await api.post("/auth/login/", {
                email: values.email,
                password: values.password,
              });

              // expected: { token, user: {id,name,email,role} }
              login(res.data.token, res.data.user);

              // ✅ optional immediate redirect (useEffect will also do it)
              navigate(res.data.user.role === "ADMIN" ? "/admin" : "/user", {
                replace: true,
              });
            } catch (err: any) {
              setStatus(err?.response?.data?.message || "Login failed");
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
                <Field className="input" name="email" placeholder="admin@gmail.com" />
                <ErrorMessage name="email" component="div" className="fieldErr" />
              </div>

              <div className="field">
                <label>Password</label>
                <Field
                  className="input"
                  name="password"
                  type="password"
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
