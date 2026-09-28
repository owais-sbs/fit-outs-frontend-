import axiosInstance from "@/lib/axiosInstance";
import { normalizeProject } from "@/modules/admin/api/projects.api";

const unwrap = (r) => r.data?.data ?? r.data;

/** Projects where the site engineer is team-assigned (alias of mine-assigned). */
export const fetchMySiteEngineerProjects = () =>
  axiosInstance.get("/projects/mine-site-engineer").then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeProject);
  });

export const fetchProjectClientContacts = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/client-contacts`).then((r) => {
    const data = unwrap(r);
    return Array.isArray(data) ? data : [];
  });
