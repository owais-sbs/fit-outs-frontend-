import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export function normalizeSiteEngineerTask(item = {}) {
  return {
    uuid: item.uuid,
    projectId: item.projectId,
    projectName: item.projectName || "",
    assigneeAccountId: item.assigneeAccountId,
    createdByAccountId: item.createdByAccountId,
    title: item.title || "",
    description: item.description || "",
    deadline: item.deadline || null,
    priority: item.priority || "MEDIUM",
    status: item.status || "TODO",
    progressNotes: item.progressNotes || "",
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

export const fetchMySiteEngineerTasks = () =>
  axiosInstance.get("/site-engineer-tasks/mine").then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeSiteEngineerTask);
  });

export const fetchProjectSiteEngineerTasks = (projectId) =>
  axiosInstance.get(`/site-engineer-tasks/project/${projectId}`).then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeSiteEngineerTask);
  });

export const createSiteEngineerTask = (payload) =>
  axiosInstance.post("/site-engineer-tasks", payload).then((r) => normalizeSiteEngineerTask(unwrap(r)));

export const updateSiteEngineerTaskStatus = (uuid, payload) =>
  axiosInstance
    .patch(`/site-engineer-tasks/${uuid}/status`, payload)
    .then((r) => normalizeSiteEngineerTask(unwrap(r)));

export const cancelSiteEngineerTask = (uuid) =>
  axiosInstance
    .patch(`/site-engineer-tasks/${uuid}/cancel`)
    .then((r) => normalizeSiteEngineerTask(unwrap(r)));
