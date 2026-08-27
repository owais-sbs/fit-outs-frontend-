import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchValidationInbox = () =>
  axiosInstance.get(`/validation/inbox`).then(unwrap);

export const fetchProjectValidations = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/validations`).then(unwrap);

export const approveValidation = (uuid) =>
  axiosInstance.post(`/validation/${uuid}/approve`).then(unwrap);

export const rejectValidation = (uuid, reason) =>
  axiosInstance.post(`/validation/${uuid}/reject`, reason ? { reason } : {}).then(unwrap);

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

export const updateQualityTemplate = (activityType, payload) =>
  axiosInstance
    .put(`/company/quality-templates/${encodeURIComponent(activityType)}`, payload)
    .then(unwrap);
