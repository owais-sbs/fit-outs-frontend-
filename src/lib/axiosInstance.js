import axios from "axios";

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Reads from .env (REACT_APP_API_BASE_URL) or falls back to local backend
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

// ─── Axios instance ───────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ─── Request interceptor — attach auth token ─────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — normalise errors ─────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }

    if (status === 403) {
      console.error("Access denied:", error.response?.data?.message);
    }

    if (status >= 500) {
      console.error("Server error:", error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
