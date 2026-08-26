import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Dev convenience: when the backend has no email provider configured, it
  // returns the reset link directly so the flow is testable end to end.
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, {
        email,
      });
      setSubmitted(true);
      if (response.data?.resetUrl) {
        setDevResetUrl(response.data.resetUrl);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Something went wrong. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto lg:w-[70%] flex flex-col justify-center">
        <h3 className="text-2xl font-semibold text-black dark:text-gray-100">Forgot Password</h3>
        <p className="text-sm text-slate-500 dark:text-gray-500 mt-1.5 mb-7">
          Enter your account email and we'll send you a link to reset your
          password.
        </p>

        {submitted ? (
          <div>
            <p className="text-sm text-slate-700 dark:text-gray-300 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-3">
              If that email is registered, a password reset link has been
              sent. It expires in 15 minutes.
            </p>

            {devResetUrl && (
              <div className="mt-4 text-xs text-slate-500 dark:text-gray-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Dev mode — no email provider configured:
                </p>
                <Link
                  to={devResetUrl.replace(window.location.origin, "")}
                  className="text-primary underline break-all"
                >
                  {devResetUrl}
                </Link>
              </div>
            )}

            <Link
              className="inline-block mt-5 text-sm font-medium text-primary hover:underline"
              to="/login"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
            />

            {error && <p className="text-red-500 dark:text-red-400 text-xs pb-2.5">{error}</p>}

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "SEND RESET LINK"}
            </button>

            <p className="text-[13px] text-slate-800 dark:text-gray-300 mt-4 text-center">
              Remembered your password?{" "}
              <Link className="font-medium text-primary underline" to="/login">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
