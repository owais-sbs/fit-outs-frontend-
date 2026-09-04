import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

/** Resolve stored file path to same-origin `/api/files/...` URL (cookie auth works). */
export function resolveFileUrl(filePath) {
  if (!filePath) return null;
  const raw = String(filePath).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/api/files/")) return raw;
  return `/api/files/${raw.replace(/^\/+/, "")}`;
}

export const fetchProjectDocuments = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/documents`).then(unwrap);

export const createProjectDocument = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/documents`, payload).then(unwrap);

export const uploadDocument = (projectId, { title, category, file, parentDocumentUuid }) => {
  const fd = new FormData();
  if (title != null) fd.append("title", title);
  if (category != null) fd.append("category", category);
  if (file) fd.append("file", file);
  if (parentDocumentUuid) fd.append("parentDocumentUuid", parentDocumentUuid);
  return axiosInstance
    .post(`/projects/${projectId}/documents/upload`, fd, multipartConfig())
    .then(unwrap);
};

export const updateProjectDocument = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/documents/${uuid}`, payload).then(unwrap);

/** Soft-delete when backend supports DELETE on documents. */
export const deleteDocument = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/documents/${uuid}`).then(unwrap);

export const deleteProjectDocument = deleteDocument;

export const publishDocumentToClient = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/documents/${uuid}/publish-to-client`).then(unwrap);

export const unpublishDocumentFromClient = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/documents/${uuid}/unpublish-from-client`).then(unwrap);

export const fetchDocumentVersions = (projectId, uuid) =>
  axiosInstance.get(`/projects/${projectId}/documents/${uuid}/versions`).then(unwrap);

export const syncDrawingsIntoDocuments = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/documents/sync-drawings`).then(unwrap);

export const fetchClientDocuments = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/documents`).then(unwrap);
