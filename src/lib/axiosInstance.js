import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

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
