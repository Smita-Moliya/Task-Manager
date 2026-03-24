import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import GoogleLoginButton from "../components/GoggleLoginButton";
import "../../src/css/login.css";
import { getFirstAllowedRoute } from "../utils/routeAccess";

export default function Login() {
  const { login, access, user, pages, isInitializing } = useAuth(); const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!isInitializing && access && user) {
      navigate(getFirstAllowedRoute(user.role, pages), { replace: true });
    }
  }, [isInitializing, access, user, pages, navigate]);
  if (isInitializing) return null;

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string()
      .min(8, "Min 8 characters")
      .matches(/[A-Z]/, "Must contain atleast one uppercase")
      .matches(/[!@#$%^&*(),.?\":{}|<>]/, "Must contain at least one special character")
      .required("Password required"),
  });

  return (
    <div className="authSplitPage">
      <div className="authSplitShell">
        <section className="authShowcase">
          <div className="authShowcaseBadge">TaskFlow Platform</div>
          <h1 className="authShowcaseTitle">
            Organize work.
            <br />
            Track progress.
            <br />
            Lead smarter.
          </h1>
          <p className="authShowcaseText">
            A modern task management system for admins and teams to manage users,
            tasks, activity, and insights from one elegant workspace.
          </p>

          <div className="authFeatureList">
            <div className="authFeaturePill">Task Tracking</div>
            <div className="authFeaturePill">Admin Analytics</div>
            <div className="authFeaturePill">Activity Logs</div>
          </div>

          <div className="authPreviewCard">
            <div className="authPreviewTop">
              <span className="authPreviewDot" />
              <span className="authPreviewDot" />
              <span className="authPreviewDot" />
            </div>

            <div className="authPreviewStats">
              <div className="authMiniStat">
                <div className="authMiniLabel">Tasks</div>
                <div className="authMiniValue">124</div>
              </div>
              <div className="authMiniStat">
                <div className="authMiniLabel">Users</div>
                <div className="authMiniValue">32</div>
              </div>
              <div className="authMiniStat">
                <div className="authMiniLabel">Completed</div>
                <div className="authMiniValue">87%</div>
              </div>
            </div>

            <div className="authMiniChart">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <section className="authFormWrap">
          <div className="loginCard premium">
            <div className="loginHead">
              <h2 className="loginTitle">Sign in</h2>
              <p className="loginSub">
                Access your workspace and continue managing your platform.
              </p>
            </div>

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={validationSchema}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={async (values, { setSubmitting }) => {
                setApiError("");
                try {
                  const res = await api.post("/auth/login/", {
                    email: values.email.trim(),
                    password: values.password,
                  });

                  login(
                    res.data.access,
                    res.data.refresh,
                    res.data.user,
                    res.data.permissions || {},
                    res.data.pages || {}
                  );
                } catch (err: any) {
                  if (axios.isAxiosError(err)) {
                    setApiError(err.response?.data?.message || "Invalid email or password");
                  } else {
                    setApiError("Login failed");
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="loginForm">
                  {apiError && <div className="alert error">{apiError}</div>}

                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <Field
                      id="email"
                      className="input"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      onFocus={() => setApiError("")}
                    />
                    <ErrorMessage name="email" component="div" className="fieldErr" />
                  </div>

                  <div className="field">
                    <div className="loginLabelRow">
                      <label htmlFor="password">Password</label>
                      <Link to="/forgot-password" className="link">
                        Forgot password?
                      </Link>
                    </div>

                    <Field
                      id="password"
                      className="input"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      onFocus={() => setApiError("")}
                    />
                    <ErrorMessage name="password" component="div" className="fieldErr" />
                  </div>

                  <button type="submit" className="btn primary loginBtn" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                  </button>

                  <div className="loginDivider">
                    <span>or continue with</span>
                  </div>

                  <div className="loginGoogle">
                    <GoogleLoginButton
                      onSuccess={(data) => {
                        login(
                          data.access,
                          data.refresh,
                          data.user,
                          data.permissions || {},
                          data.pages || {}
                        );
                      }}
                    />
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </section>
      </div>
    </div>
  );
}