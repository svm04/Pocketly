import React, { useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { Link } from "react-router-dom";
import { validateEmail } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import uploadImage from "../../utils/uploadImage";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useContext } from "react";
import { UserContext } from "../../context/userContextValue";

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateUser } = useContext(UserContext);

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    let profileImageUrl = "";

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter the password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    //SignUp API Call

    try {
      //upload profile picture if exists
      if (profilePic) {
        const imageUploadRes = await uploadImage(profilePic);
        profileImageUrl = imageUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName,
        email,
        password,
        profileImageUrl,
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
      <div className="w-full max-w-lg mx-auto h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center ">
        <h3 className="text-2xl font-semibold text-black dark:text-gray-100">Create an Account</h3>
        <p className="text-sm text-slate-500 dark:text-gray-500 mt-1.5 mb-7">
          Join us today by entering your details below.
        </p>
        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="John Doe"
              type="text"
            />

            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
            />
            <div className="col-span-2">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Password"
                placeholder="Min 8 characters"
                type="password"
              />
            </div>
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "SIGN UP"}
          </button>

          <p className="text-[13px] text-slate-800 dark:text-gray-300 mt-4 text-center">
            Already have an account?{" "}
            <Link className="font-medium text-primary underline" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
