import axiosInstance from "@/lib/axiosInstance";

const unwrap = (response) => response.data?.data ?? response.data;

export function validatePasswordSetupToken(token) {
  return axiosInstance.get(`/auth/password-setup/${token}`).then(unwrap);
}

export function completePasswordSetup(token, password) {
  return axiosInstance
    .post(`/auth/password-setup/${token}`, { password })
    .then(unwrap);
}

export function requestPasswordSetupEmail(email) {
  return axiosInstance
    .post("/auth/password-setup/request", { email })
    .then(unwrap);
}
