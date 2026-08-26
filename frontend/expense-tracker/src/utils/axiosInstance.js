import axios from "axios";
import { BASE_URL, API_PATHS } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accesstoken = localStorage.getItem("token");
    if (accesstoken) {
      config.headers.Authorization = `Bearer ${accesstoken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// When an access token expires, a single in-flight refresh call is shared
// by every request that hits a 401 at the same time, instead of each one
// firing its own refresh (and racing to rotate the refresh token).
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        console.error("Request timed out. Please try again.");
      }
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest?.url?.includes(API_PATHS.AUTH.LOGIN) ||
      originalRequest?.url?.includes(API_PATHS.AUTH.REGISTER) ||
      originalRequest?.url?.includes(API_PATHS.AUTH.REFRESH_TOKEN);

    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearSessionAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeToRefresh((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}${API_PATHS.AUTH.REFRESH_TOKEN}`, {
          refreshToken,
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        isRefreshing = false;
        onRefreshed(data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(null);
        clearSessionAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    if (error.response.status === 401 && isAuthEndpoint) {
      // Login/register/refresh itself failed — nothing to refresh, just
      // let the caller handle the error message.
    } else if (error.response.status === 500) {
      console.error("Server Error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
