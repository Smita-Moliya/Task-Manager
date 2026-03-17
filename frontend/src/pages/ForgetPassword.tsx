import { useState } from "react";
import { api } from "../api/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link } from "react-router-dom";
import { MsgType } from "../types/form";

type Values = { email: string };


export default function ForgotPassword() {
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<MsgType>("");
  const [sending, setSending] = useState(false);

  const schema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authHeader">
          <h2 className="authTitle">Reset Password</h2>
          <p className="authSub">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <Formik<Values>
          initialValues={{ email: "" }}
          validationSchema={schema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setMsg("");
            setMsgType("");
            setSending(true);

            const email = values.email.trim().toLowerCase();

            try {
              const res = await api.post("/auth/send-reset-link/", { email });
              setMsg(res.data?.message || "If this email exists, a reset link has been sent.");
              setMsgType("success");
              resetForm();
            } catch (err: any) {
              const data = err?.response?.data;
              setMsg(data?.message || data?.error || "Failed to send reset link");
              setMsgType("error");
            } finally {
              setSending(false);
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="form">
              {msg && <div className={`alert ${msgType || "error"}`}>{msg}</div>}

              <div className="field">
                <label className="label">Email</label>
                <Field
                  className="input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <ErrorMessage name="email" component="div" className="fieldErr" />
              </div>

              <button
                className="btn primary btnFull"
                type="submit"
                disabled={sending || isSubmitting}
              >
                {sending || isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="authFooter">
                <span>Remember your password?</span>
                <Link className="link" to="/login">Back to login</Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
