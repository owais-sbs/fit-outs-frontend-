import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

/** Projects where the site engineer is team-assigned or has related work. */
export const fetchMySiteEngineerProjects = () =>
  axiosInstance.get("/projects/mine-site-engineer").then((r) => {
    const data = unwrap(r);
    return Array.isArray(data) ? data : [];
  });

export const fetchProjectClientContacts = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/client-contacts`).then((r) => {
    const data = unwrap(r);
    return Array.isArray(data) ? data : [];
  });
