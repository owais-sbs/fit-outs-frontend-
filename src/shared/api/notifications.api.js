import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchNotifications = (limit = 50) =>
  axiosInstance.get("/notifications", { params: { limit } }).then(unwrap);

export const fetchUnreadNotificationCount = () =>
  axiosInstance.get("/notifications/unread-count").then(unwrap);

export const markNotificationRead = (uuid) =>
  axiosInstance.post(`/notifications/${uuid}/read`).then(unwrap);

export const markAllNotificationsRead = () =>
  axiosInstance.post("/notifications/read-all").then(unwrap);
