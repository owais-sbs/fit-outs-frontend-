import axiosInstance from "@/lib/axiosInstance";

const unwrap = (response) => response.data?.data ?? response.data;

export function forgotPassword(email) {
  return axiosInstance.post("/auth/forgot-password", { email }).then(unwrap);
}

export function resetPassword({ token, newPassword }) {
  return axiosInstance
    .post("/auth/reset-password", { token, newPassword })
    .then(unwrap);
}
