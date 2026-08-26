import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { Link } from "react-router-dom";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContextValue";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateUser } = useContext(UserContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    //Login API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });
      const { token, refreshToken, user } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
        updateUser(user);
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        setError(
          "The server is waking up from sleep (free hosting tier) — this can take up to a minute. Please try again shortly."
        );
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto lg:w-[70%] flex flex-col justify-center">
        <h3 className="text-2xl font-semibold text-black dark:text-gray-100">Welcome Back</h3>
        <p className="text-sm text-slate-500 dark:text-gray-500 mt-1.5 mb-7">
          Please enter your details to log in
        </p>

        <form onSubmit={handleLogin}>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            placeholder="Min 8 characters"
            type="password"
          />

          <div className="flex justify-end -mt-2 mb-4">
            <Link
              className="text-xs font-medium text-primary hover:underline"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "LOGIN"}
          </button>

          <p className="text-[13px] text-slate-800 dark:text-gray-300 mt-4 text-center">
            Don't have an account?{" "}
            <Link className="font-medium text-primary underline" to="/signUp">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
