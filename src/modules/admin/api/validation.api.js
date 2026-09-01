import axiosInstance from "@/lib/axiosInstance";
import {
  approveScClaim,
  rejectScClaim,
} from "./subcontractor.api";

const unwrap = (r) => r.data?.data ?? r.data;

const emptyInbox = () => ({
  progressItems: [],
  claimItems: [],
  pendingProgressCount: 0,
  pendingClaimCount: 0,
});

export const normalizeValidationInbox = (data) => {
  if (!data) return emptyInbox();
  if (Array.isArray(data)) {
    return {
      progressItems: data,
      claimItems: [],
      pendingProgressCount: data.filter((i) => !i.status || i.status === "PENDING").length,
      pendingClaimCount: 0,
    };
  }
  return {
    progressItems: Array.isArray(data.progressItems) ? data.progressItems : [],
    claimItems: Array.isArray(data.claimItems) ? data.claimItems : [],
    pendingProgressCount: data.pendingProgressCount ?? 0,
    pendingClaimCount: data.pendingClaimCount ?? 0,
  };
};

export const fetchValidationInbox = () =>
  axiosInstance.get(`/validation/inbox`).then((r) => normalizeValidationInbox(unwrap(r)));

export const fetchProjectValidations = (projectId) =>
  axiosInstance
    .get(`/projects/${projectId}/validations`)
    .then((r) => normalizeValidationInbox(unwrap(r)));

export const approveValidation = (uuid) =>
  axiosInstance.post(`/validation/${uuid}/approve`).then(unwrap);

export const rejectValidation = (uuid, reason) =>
  axiosInstance.post(`/validation/${uuid}/reject`, reason ? { reason } : {}).then(unwrap);

export { approveScClaim, rejectScClaim };

export const submitProgressForValidation = (activityUuid, progressUuid) =>
  axiosInstance
    .post(`/schedule/activities/${activityUuid}/progress/${progressUuid}/submit-for-validation`)
    .then(unwrap);

/** Hold points — FE stubs until backend is fully ready. */
export const fetchHoldPoints = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/hold-points`).then(unwrap);

export const createHoldPoint = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/hold-points`, payload).then(unwrap);

export const clearHoldPoint = (projectId, uuid, payload) =>
  axiosInstance
    .post(`/projects/${projectId}/hold-points/${uuid}/clear`, payload || {})
    .then(unwrap);

/** Optional quality checklist templates keyed by activity type. */
export const fetchQualityTemplate = (activityType) =>
  axiosInstance
    .get(`/company/quality-templates/${encodeURIComponent(activityType)}`)
    .then(unwrap);

export const fetchQualityTemplates = () =>
  axiosInstance.get(`/company/quality-templates`).then((r) => {
    const data = r.data?.data ?? r.data;
    return Array.isArray(data) ? data : [];
  });

export const updateQualityTemplate = (activityType, payload) =>
  axiosInstance
    .put(`/company/quality-templates/${encodeURIComponent(activityType)}`, payload)
    .then(unwrap);
