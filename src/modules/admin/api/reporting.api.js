import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchProgressReport = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/progress-report`).then(unwrap);
