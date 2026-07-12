import axiosInstance from "@/lib/axiosInstance";

export const generateBoqFromQto = (sessionId) =>
  axiosInstance.post(`/boq/generate-from-qto/${sessionId}`).then((r) => r.data?.data ?? r.data);

export const saveBoqFromSurvey = (data) =>
  axiosInstance.post("/boq/from-survey", data).then((r) => r.data?.data ?? r.data);

export const fetchBoq = (id) =>
  axiosInstance.get(`/boq/${id}`).then((r) => r.data?.data ?? r.data);

export const fetchBoqsByProject = (projectId) =>
  axiosInstance.get(`/boq/project/${projectId}`).then((r) => r.data?.data ?? r.data);

export const updateBoq = (id, data) =>
  axiosInstance.put(`/boq/${id}`, data).then((r) => r.data?.data ?? r.data);

/** @deprecated use submitBoq */
export const finalizeBoq = (id) =>
  axiosInstance.post(`/boq/${id}/finalize`).then((r) => r.data?.data ?? r.data);

export const submitBoq = (id) =>
  axiosInstance.post(`/boq/${id}/submit`).then((r) => r.data?.data ?? r.data);

export const approveBoq = (id, comments) =>
  axiosInstance.post(`/boq/${id}/approve`, { comments }).then((r) => r.data?.data ?? r.data);

export const rejectBoq = (id, comments) =>
  axiosInstance.post(`/boq/${id}/reject`, { comments }).then((r) => r.data?.data ?? r.data);

export const createBoqRevision = (id, revisionLabel) =>
  axiosInstance.post(`/boq/${id}/revisions`, { revisionLabel }).then((r) => r.data?.data ?? r.data);

export const fetchBoqInbox = () =>
  axiosInstance.get("/boq/inbox").then((r) => r.data?.data ?? r.data);

export const fetchBoqApprovalHistory = (id) =>
  axiosInstance.get(`/boq/${id}/approval-history`).then((r) => r.data?.data ?? r.data);
