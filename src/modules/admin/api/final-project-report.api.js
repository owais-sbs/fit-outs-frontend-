import axiosInstance from "@/lib/axiosInstance";

export const fetchFinalProjectReport = (projectId) =>
  axiosInstance
    .get(`/projects/${projectId}/final-project-report`, { timeout: 120000 })
    .then((r) => r.data?.data ?? r.data);
