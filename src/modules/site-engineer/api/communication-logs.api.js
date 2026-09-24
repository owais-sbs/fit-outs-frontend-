import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export function normalizeCommLog(item = {}) {
  return {
    uuid: item.uuid,
    projectId: item.projectId,
    projectName: item.projectName || "",
    authorAccountId: item.authorAccountId,
    authorName: item.authorName || "",
    occurredAt: item.occurredAt || null,
    channel: item.channel || "OTHER",
    summary: item.summary || "",
    clientRequests: item.clientRequests || "",
    agreedChanges: item.agreedChanges || "",
    relatedChannelId: item.relatedChannelId || null,
    createdAt: item.createdAt || null,
  };
}

export const fetchProjectCommunicationLogs = (projectId) =>
  axiosInstance.get(`/client-communication-logs/project/${projectId}`).then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeCommLog);
  });

export const fetchMyCommunicationLogs = () =>
  axiosInstance.get("/client-communication-logs/mine").then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeCommLog);
  });

export const createCommunicationLog = (payload) =>
  axiosInstance
    .post("/client-communication-logs", payload)
    .then((r) => normalizeCommLog(unwrap(r)));

export const fetchClientPortalCommunicationLogs = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/communication-logs`).then((r) => {
    const data = unwrap(r);
    return (Array.isArray(data) ? data : []).map(normalizeCommLog);
  });
