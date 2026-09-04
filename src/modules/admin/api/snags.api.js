import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

export const SNAG_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "READY_FOR_INSPECTION",
  "RESOLVED",
  "CLOSED",
];

/** Primary workflow shown in UI (RESOLVED remains supported as optional). */
export const SNAG_WORKFLOW_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "READY_FOR_INSPECTION",
  "CLOSED",
];

export const SNAG_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const fetchProjectSnags = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/snags`).then(unwrap);

export const createSnag = async (projectId, payload = {}) => {
  const { photo, photos, ...rest } = payload;
  const files = [
    ...(photo instanceof File ? [photo] : []),
    ...(Array.isArray(photos) ? photos.filter((f) => f instanceof File) : []),
  ];
  const created = await axiosInstance.post(`/projects/${projectId}/snags`, rest).then(unwrap);
  if (created?.uuid && files.length > 0) {
    let latest = created;
    for (const file of files) {
      latest = await uploadSnagPhoto(projectId, created.uuid, file);
    }
    return latest;
  }
  return created;
};

export const updateSnag = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/snags/${uuid}`, payload).then(unwrap);

export const updateSnagStatus = (projectId, uuid, status) =>
  axiosInstance.patch(`/projects/${projectId}/snags/${uuid}/status`, { status }).then(unwrap);

export const uploadSnagPhoto = (projectId, uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/projects/${projectId}/snags/${uuid}/photos`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => {
      if (r.data?.isSuccess === false) {
        throw new Error(r.data?.error || r.data?.message || "Upload failed");
      }
      return r.data?.data ?? r.data;
    });
};

export const deleteSnag = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/snags/${uuid}`).then(unwrap);

export const fetchClientSnags = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/snags`).then(unwrap);

export const createClientSnag = async (projectId, payload = {}) => {
  const { photo, photos, ...rest } = payload;
  const files = [
    ...(photo instanceof File ? [photo] : []),
    ...(Array.isArray(photos) ? photos.filter((f) => f instanceof File) : []),
  ];
  const created = await axiosInstance.post(`/client/projects/${projectId}/snags`, rest).then(unwrap);
  if (created?.uuid && files.length > 0) {
    let latest = created;
    for (const file of files) {
      latest = await uploadClientSnagPhoto(projectId, created.uuid, file);
    }
    return latest;
  }
  return created;
};

export const approveClientSnag = (projectId, uuid) =>
  axiosInstance.post(`/client/projects/${projectId}/snags/${uuid}/approve`).then(unwrap);

export const uploadClientSnagPhoto = (projectId, uuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/client/projects/${projectId}/snags/${uuid}/photos`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => {
      if (r.data?.isSuccess === false) {
        throw new Error(r.data?.error || r.data?.message || "Upload failed");
      }
      return r.data?.data ?? r.data;
    });
};
