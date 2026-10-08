import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

/** Strip absolute backend /api/files URLs down to the stored relative key. */
export function toStoredFileKey(filePath) {
  if (!filePath) return null;
  let raw = String(filePath).trim();
  if (!raw) return null;
  const localApi = raw.match(/^https?:\/\/[^/]+\/api\/files\/(.+)$/i);
  if (localApi) raw = localApi[1];
  if (raw.startsWith("/api/files/")) raw = raw.slice("/api/files/".length);
  if (raw.startsWith("/files/")) raw = raw.slice("/files/".length);
  return raw.replace(/^\/+/, "") || null;
}

/** Axios path under baseURL `/api` (e.g. `/files/uploads/x.pdf`). Null for remote http(s) URLs. */
export function toFilesApiPath(filePath) {
  const key = toStoredFileKey(filePath);
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return null;
  return `/files/${key}`;
}

/** Resolve stored file path to same-origin `/api/files/...` URL (cookie auth + CRA proxy). */
export function resolveFileUrl(filePath) {
  if (!filePath) return null;
  const raw = String(filePath).trim();
  if (!raw) return null;
  // Rewrite absolute localhost/backend URLs so the iframe/img hits the FE proxy, not :8080 directly.
  const localApi = raw.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/api\/files\/(.+)$/i);
  if (localApi) return `/api/files/${localApi[1]}`;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/api/files/")) return raw;
  return `/api/files/${raw.replace(/^\/+/, "")}`;
}

/** Authenticated blob fetch for in-app preview (avoids iframe hitting :8080 without proxy/cookies). */
export async function fetchDocumentFileBlob(filePath) {
  const apiPath = toFilesApiPath(filePath);
  if (apiPath) {
    const response = await axiosInstance.get(apiPath, { responseType: "blob" });
    return response.data;
  }
  const absolute = String(filePath || "").trim();
  if (!/^https?:\/\//i.test(absolute)) {
    throw new Error("Invalid file path");
  }
  const res = await fetch(absolute, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load (${res.status})`);
  return res.blob();
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

export const publishDocumentToSc = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/documents/${uuid}/publish-to-sc`).then(unwrap);

export const unpublishDocumentFromSc = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/documents/${uuid}/unpublish-from-sc`).then(unwrap);

export const fetchDocumentVersions = (projectId, uuid) =>
  axiosInstance.get(`/projects/${projectId}/documents/${uuid}/versions`).then(unwrap);

export const syncDrawingsIntoDocuments = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/documents/sync-drawings`).then(unwrap);

export const fetchClientDocuments = (projectId) =>
  axiosInstance.get(`/client/projects/${projectId}/documents`).then(unwrap);

export const fetchScDocuments = (projectId) =>
  axiosInstance.get(`/subcontractor/projects/${projectId}/documents`).then(unwrap);
