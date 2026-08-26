// In production this comes from the VITE_API_BASE_URL env var (set it in
// Vercel's project settings to your deployed backend's URL); locally it
// falls back to the backend's default dev port so `npm run dev` keeps
// working with no setup.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

//utils/apiPaths.js
export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    GET_USER_INFO: "/api/v1/auth/getuser",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    LOGOUT: "/api/v1/auth/logout",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    RESET_PASSWORD: (token) => `/api/v1/auth/reset-password/${token}`,
    UPDATE_PROFILE: "/api/v1/auth/profile",
    CHANGE_PASSWORD: "/api/v1/auth/change-password",
  },
  DASHBOARD: {
    GET_DATA: "/api/v1/dashboard",
  },
  TRANSACTIONS: {
    GET_ALL: "/api/v1/transactions/get",
    EXPORT_EXCEL: "/api/v1/transactions/export/excel",
  },
  INCOME: {
    ADD_INCOME: "/api/v1/income/add",
    UPDATE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
    GET_ALL_INCOME: "/api/v1/income/get",
    MONTHLY_SUMMARY: "/api/v1/income/monthly-summary",
    DELETE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
    DOWNLOAD_INCOME: "/api/v1/income/downloadexcel",
  },
  EXPENSE: {
    ADD_EXPENSE: "/api/v1/expense/add",
    UPDATE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
    GET_ALL_EXPENSE: "/api/v1/expense/get",
    MONTHLY_SUMMARY: "/api/v1/expense/monthly-summary",
    DELETE_EXPENSE: (expenseId) => `/api/v1/expense/${expenseId}`,
    DOWNLOAD_EXPENSE: "/api/v1/expense/downloadexcel",
  },
  BUDGET: {
    ADD_BUDGET: "/api/v1/budget/add",
    GET_STATUS: "/api/v1/budget/status",
    COPY_FORWARD: "/api/v1/budget/copy-forward",
    UPDATE_BUDGET: (budgetId) => `/api/v1/budget/${budgetId}`,
    DELETE_BUDGET: (budgetId) => `/api/v1/budget/${budgetId}`,
  },
  RECURRING: {
    ADD_RECURRING: "/api/v1/recurring/add",
    GET_ALL_RECURRING: "/api/v1/recurring/get",
    TOGGLE_RECURRING: (id) => `/api/v1/recurring/${id}/toggle`,
    DELETE_RECURRING: (id) => `/api/v1/recurring/${id}`,
  },
  GOALS: {
    ADD_GOAL: "/api/v1/goals/add",
    GET_ALL_GOALS: "/api/v1/goals/get",
    UPDATE_GOAL: (id) => `/api/v1/goals/${id}`,
    CONTRIBUTE_GOAL: (id) => `/api/v1/goals/${id}/contribute`,
    DELETE_GOAL: (id) => `/api/v1/goals/${id}`,
  },
  IMAGE: {
    UPLOAD_IMAGE: "/api/v1/auth/upload-image",
  },
};
