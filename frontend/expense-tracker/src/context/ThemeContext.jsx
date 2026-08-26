import React, { useState } from "react";
import { ThemeContext } from "./themeContextValue";

const STORAGE_KEY = "theme";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyThemeClass = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

// A small inline script in index.html already applies the right class
// before first paint (to avoid a flash of the wrong theme), so this
// provider just needs to keep state/localStorage/the DOM class in sync
// from here on.
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  const setAndApplyTheme = (next) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyThemeClass(next);
  };

  const toggleTheme = () => {
    setAndApplyTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setAndApplyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
