import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const SNAG_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "READY_FOR_INSPECTION",
  "RESOLVED",
  "CLOSED",
];

export const SNAG_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const fetchProjectSnags = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/snags`).then(unwrap);

/**
 * Create snag. When `photo` (File) is provided, posts multipart FormData
 * including severity, dueDate, and photo.
 */
export const createSnag = (projectId, payload = {}) => {
  const { photo, ...rest } = payload;
  if (photo instanceof File) {
    const fd = new FormData();
    Object.entries(rest).forEach(([k, v]) => {
      if (v != null && v !== "") fd.append(k, v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
    });
    fd.append("photo", photo);
    return axiosInstance
      .post(`/projects/${projectId}/snags`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(unwrap);
  }
  return axiosInstance.post(`/projects/${projectId}/snags`, rest).then(unwrap);
};

export const updateSnag = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/snags/${uuid}`, payload).then(unwrap);

export const updateSnagStatus = (projectId, uuid, status) =>
  axiosInstance.patch(`/projects/${projectId}/snags/${uuid}/status`, { status }).then(unwrap);

export const uploadSnagPhoto = (projectId, uuid, file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return axiosInstance
    .post(`/projects/${projectId}/snags/${uuid}/photo`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
};

export const deleteSnag = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/snags/${uuid}`).then(unwrap);

export const fetchClientSnags = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/snags`).then(unwrap);
