import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

export const REASON_CODES = [
  "SCOPE_CHANGE",
  "CLIENT_REQUEST",
  "SITE_CONDITION",
  "DESIGN_CHANGE",
  "OMISSION",
  "QUANTITY_VARIATION",
  "ACCELERATION",
  "OTHER",
];

export const fetchProjectVariations = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/variations`).then(unwrap);

export const fetchVariation = (projectId, uuid) =>
  axiosInstance.get(`/projects/${projectId}/variations/${uuid}`).then(unwrap);

export const fetchVariationBoqAudit = (projectId, uuid) =>
  axiosInstance
    .get(`/projects/${projectId}/variations/${uuid}/boq-changes`)
    .then(unwrap);

export const createVariation = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/variations`, payload).then(unwrap);

export const updateVariation = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/variations/${uuid}`, payload).then(unwrap);

export const triageVariation = (projectId, uuid, payload) =>
  axiosInstance.post(`/projects/${projectId}/variations/${uuid}/triage`, payload).then(unwrap);

export const submitVariationReview = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/variations/${uuid}/submit-review`).then(unwrap);

export const clientApproveVariation = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/variations/${uuid}/approve`).then(unwrap);

export const clientRejectVariation = (projectId, uuid, comment) =>
  axiosInstance.post(`/projects/${projectId}/variations/${uuid}/reject`, { comment }).then(unwrap);

export const uploadVariationAttachment = (projectId, uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/projects/${projectId}/variations/${uuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

export const fetchVariationTriageInbox = () =>
  axiosInstance.get("/variations/triage-inbox").then(unwrap);

export const fetchProjectCommercial = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/commercial`).then(unwrap);
