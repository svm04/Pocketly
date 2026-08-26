import { createContext } from "react";

// Split into its own file (rather than living in ThemeContext.jsx alongside
// the ThemeProvider component) so Vite/React Fast Refresh can reliably hot
// reload the provider component.
export const ThemeContext = createContext();
