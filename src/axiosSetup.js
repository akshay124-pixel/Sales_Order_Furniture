import axios from "axios";

// Configure a base URL if desired; components often use absolute URLs already
const BASE_URL = process.env.REACT_APP_URL;
if (BASE_URL) {
  axios.defaults.baseURL = BASE_URL;
}

// Attach token on every request if present
axios.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token && !config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isLoggingOut = false;

function forceLogout(message = "Session expired. Please log in again.") {
  if (isLoggingOut) return; // prevent duplicate toasts/redirects
  isLoggingOut = true;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
  } catch (_) {}
  // Redirect to login without leaving history entry
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  } else {
    // Already on login — allow new login attempts
    isLoggingOut = false;
  }
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isNetwork = !!error?.code && error.code === "ERR_NETWORK";
    const shouldLogout =
      isNetwork ||
      status === 401 ||
      status === 403 ||
      (typeof status === "number" && status >= 500);

    if (shouldLogout) {
      const msg =
        status === 401 || status === 403
          ? "Session expired. Please log in again."
          : isNetwork
          ? "Connection lost. Please log in again."
          : "Server error. Please log in again.";
      forceLogout(msg);
    }

    return Promise.reject(error);
  }
);

export {};
