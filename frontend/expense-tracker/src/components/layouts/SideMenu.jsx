import React, { useContext, useState } from "react";
import { LuUser, LuLogOut } from "react-icons/lu";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContextValue";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../Modal";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleClick = (route) => {
    navigate(route);
  };

  const confirmLogout = () => {
    // Best-effort server-side revocation of the refresh token — the local
    // session is cleared either way, so a failed/slow request here never
    // blocks logging out.
    axiosInstance.post(API_PATHS.AUTH.LOGOUT).catch(() => {});
    localStorage.clear();
    clearUser();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800 p-5 sticky top-[61px] z-20 flex flex-col">
      <button
        type="button"
        className="w-full flex flex-col items-center justify-center gap-3 mb-7 group"
        onClick={() => navigate("/profile")}
        title="Edit profile"
      >
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="Profile"
            className="w-20 h-20 bg-slate-400 rounded-full object-cover group-hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center bg-purple-100 dark:bg-purple-500/10 text-primary rounded-full text-3xl group-hover:opacity-80 transition-opacity">
            <LuUser />
          </div>
        )}

        <h5 className="text-gray-950 dark:text-gray-100 font-medium leading-6 group-hover:text-primary transition-colors">
          {user?.fullName || "Guest User"}
        </h5>
      </button>

      <div className="flex-1">
        {SIDE_MENU_DATA.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] ${
              activeMenu === item.label
                ? "text-white bg-primary"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            } py-3 px-6 rounded-lg mb-3`}
            onClick={() => handleClick(item.path)}
          >
            <item.icon className="text-xl" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Kept visually separate from the regular nav (own section, divider,
          warning color) and gated behind a confirmation step, since it's a
          destructive-ish action that shouldn't sit one accidental click
          away from "Goals" or "Budgets". */}
      <div className="pt-3 mt-3 border-t border-gray-200/70 dark:border-gray-700/70">
        <button
          type="button"
          className="w-full flex items-center gap-4 text-[15px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 py-3 px-6 rounded-lg cursor-pointer"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LuLogOut className="text-xl" />
          Logout
        </button>
      </div>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log Out"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to log out of Pocketly?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 whitespace-nowrap px-4 py-2 rounded-lg"
            onClick={confirmLogout}
          >
            Log Out
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SideMenu;
