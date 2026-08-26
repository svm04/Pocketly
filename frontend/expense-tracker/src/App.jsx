import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Home from "./pages/Dashboard/Home";
import Income from "./pages/Dashboard/Income";
import Expense from "./pages/Dashboard/Expense";
import Budgets from "./pages/Dashboard/Budgets";
import Goals from "./pages/Dashboard/Goals";
import Transactions from "./pages/Dashboard/Transactions";
import Profile from "./pages/Dashboard/Profile";
import UserProvider from "./context/UserContext";
import ThemeProvider from "./context/ThemeContext";

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <div>
          <Router>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/login" exact element={<Login />} />
              <Route path="/signUp" exact element={<SignUp />} />
              <Route path="/forgot-password" exact element={<ForgotPassword />} />
              <Route path="/reset-password/:token" exact element={<ResetPassword />} />
              <Route path="/dashboard" exact element={<Home />} />
              <Route path="/income" exact element={<Income />} />
              <Route path="/expense" exact element={<Expense />} />
              <Route path="/budgets" exact element={<Budgets />} />
              <Route path="/goals" exact element={<Goals />} />
              <Route path="/transactions" exact element={<Transactions />} />
              <Route path="/profile" exact element={<Profile />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </div>

        <Toaster
          toastOptions={{
            className: "",
            style: {
              fontSize: "13px",
            },
          }}
        />
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;

const Root = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ) : (
    <Navigate to="/login" />
  );
};
