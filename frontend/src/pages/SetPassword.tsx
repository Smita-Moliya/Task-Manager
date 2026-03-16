import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const getPasswordErrors = (password: string) => {
  const errors: string[] = [];

  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character");

  return errors;
};

export default function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token") || "", [params]);

  const validationSchema = Yup.object({
    password: Yup.string().required("Password required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords do not match")
      .required("Confirm password required"),
  });

  return (
    <div className="page">
      <div className="card">
        <h2 className="heading">Set Password</h2>

        {!token && (
          <div className="alert error">
            Token missing. Please open the email link again.
          </div>
        )}

        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setStatus, setSubmitting }) => {

            const ruleErrors = getPasswordErrors(values.password);
            if (ruleErrors.length) {
              setStatus("Please satisfy password requirements.");
              setSubmitting(false);
              return;
            }

            try {
              const res = await api.post("/auth/set-password/", {
                token,
                password: values.password,
                confirm_password: values.confirmPassword,
              });

              setStatus(res.data?.message || "Password set successfully");
              setTimeout(() => navigate("/"), 1200);

            } catch (err: unknown) {
              if (axios.isAxiosError(err)) {
                setStatus(err.response?.data?.message || "Request failed");
              } else {
                setStatus("Unexpected error");
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, status, isSubmitting }) => {

            const ruleErrors = getPasswordErrors(values.password);

            return (
              <Form className="form">

                {status && (
                  <div className={`alert ${status.includes("success") ? "success" : "error"}`}>
                    {status}
                  </div>
                )}

                <div className="field">
                  <label>New Password</label>
                  <Field
                    className="input"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <ErrorMessage name="password" component="div" className="fieldErr" />

                  {/*  LIVE RULE DISPLAY */}
                  {values.password && ruleErrors.length > 0 && (
                    <div className="fieldErr">
                      <ul style={{ margin: "6px 0 0 18px" }}>
                        {ruleErrors.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {values.password && ruleErrors.length === 0 && (
                    <div className="alert success">Password looks good </div>
                  )}
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <Field
                    className="input"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="fieldErr" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !token}
                  className="btn primary"
                >
                  {isSubmitting ? "Setting..." : "Set Password"}
                </button>

              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
