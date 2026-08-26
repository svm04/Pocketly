import React, { useContext } from "react";
import { LuSun, LuMoon } from "react-icons/lu";
import { ThemeContext } from "../context/themeContextValue";

// Sun/moon icon button that flips between light and dark mode. Drop it
// anywhere in the shared layout — it reads/writes the single ThemeContext
// so every instance stays in sync.
const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200/50 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${className}`}
    >
      {isDark ? <LuSun className="text-lg" /> : <LuMoon className="text-lg" />}
    </button>
  );
};

export default ThemeToggle;
