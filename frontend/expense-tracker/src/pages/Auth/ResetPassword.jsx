import React, { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContextValue";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useContext(UserContext);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.AUTH.RESET_PASSWORD(token),
        { password }
      );

      const { token: accessToken, refreshToken, user } = response.data;
      if (accessToken) {
        localStorage.setItem("token", accessToken);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        updateUser(user);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "This reset link is invalid or has expired. Please request a new one."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto lg:w-[70%] flex flex-col justify-center">
        <h3 className="text-2xl font-semibold text-black dark:text-gray-100">Reset Password</h3>
        <p className="text-sm text-slate-500 dark:text-gray-500 mt-1.5 mb-7">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="New Password"
            placeholder="Min 8 characters"
            type="password"
          />

          <Input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            label="Confirm New Password"
            placeholder="Re-enter password"
            type="password"
          />

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs pb-2.5">
              {error}{" "}
              <Link className="underline" to="/forgot-password">
                Request a new link
              </Link>
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "RESET PASSWORD"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
