import { createContext } from "react";

// Split into its own file (rather than living in UserContext.jsx alongside
// the UserProvider component) so Vite/React Fast Refresh can reliably hot
// reload the provider component.
export const UserContext = createContext();
