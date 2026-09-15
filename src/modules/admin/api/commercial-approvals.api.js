import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchCommercialMatrices = () =>
  axiosInstance.get("/commercial-approvals/matrices").then(unwrap);

export const upsertCommercialMatrix = (payload) =>
  axiosInstance.put("/commercial-approvals/matrices", payload).then(unwrap);

export const fetchCommercialApprovalInbox = () =>
  axiosInstance.get("/commercial-approvals/inbox").then(unwrap);

export const fetchCommercialApprovalRun = (runUuid) =>
  axiosInstance.get(`/commercial-approvals/runs/${runUuid}`).then(unwrap);

export const approveCommercialTask = (taskUuid, comment) =>
  axiosInstance
    .post(`/commercial-approvals/tasks/${taskUuid}/approve`, comment ? { comment } : {})
    .then(unwrap);

export const rejectCommercialTask = (taskUuid, comment) =>
  axiosInstance
    .post(`/commercial-approvals/tasks/${taskUuid}/reject`, { comment })
    .then(unwrap);

export const exportCommercialApprovalsCsv = async (params = {}) => {
  const res = await axiosInstance.get("/commercial-approvals/export", {
    params,
    responseType: "blob",
  });
  return res.data;
};
