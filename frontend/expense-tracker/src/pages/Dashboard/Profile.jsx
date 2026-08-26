import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContextValue";
import Input from "../../components/Inputs/Input";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import uploadImage from "../../utils/uploadImage";

const Profile = () => {
  useUserAuth();
  const { user, updateUser } = useContext(UserContext);

  const [fullName, setFullName] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // `user` loads asynchronously from context, so sync the local form field
  // to it once it arrives. Adjusting state during render (rather than in a
  // useEffect) avoids an extra render pass — see the React docs' "Adjusting
  // some state when a prop changes" pattern.
  const [syncedName, setSyncedName] = useState(null);
  if (user?.fullName && user.fullName !== syncedName) {
    setSyncedName(user.fullName);
    setFullName(user.fullName);
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      let profileImageUrl = user?.profileImageUrl;

      if (profilePic) {
        const uploadRes = await uploadImage(profilePic);
        profileImageUrl = uploadRes.imageUrl || profileImageUrl;
      }

      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        fullName,
        profileImageUrl,
      });

      updateUser(response.data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await axiosInstance.put(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Profile">
      <div className="my-5 mx-auto max-w-2xl space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h5 className="text-lg font-medium mb-1 dark:text-gray-100">Profile</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Update your name and profile photo.
          </p>

          <form onSubmit={handleSaveProfile}>
            <ProfilePhotoSelector
              image={profilePic}
              setImage={setProfilePic}
              initialImageUrl={user?.profileImageUrl}
            />

            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              label="Full Name"
              placeholder="John Doe"
              type="text"
            />

            <Input
              value={user?.email || ""}
              onChange={() => {}}
              label="Email Address"
              placeholder=""
              type="text"
              disabled
            />

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="btn-primary w-auto px-6"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md shadow-gray-100 dark:shadow-none border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h5 className="text-lg font-medium mb-1 dark:text-gray-100">Change Password</h5>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Choose a strong password you're not using elsewhere.
          </p>

          <form onSubmit={handleChangePassword}>
            <Input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              label="Current Password"
              placeholder=""
              type="password"
            />
            <Input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              label="New Password"
              placeholder="Min 8 characters"
              type="password"
            />
            <Input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm New Password"
              placeholder=""
              type="password"
            />

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="btn-primary w-auto px-6"
                disabled={changingPassword}
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
