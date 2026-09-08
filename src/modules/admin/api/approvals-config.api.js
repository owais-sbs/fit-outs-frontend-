import axiosInstance from "@/lib/axiosInstance";

const catalogTimeout = { timeout: 120000 };

const dataOf = (r) => {
  const body = r.data;
  if (body && body.isSuccess === false) {
    return Promise.reject(new Error(body.error || body.message || "Request failed"));
  }
  return body?.data ?? body;
};

export const fetchApprovalsCatalog = () =>
  axiosInstance.get("/approvals-catalog", catalogTimeout).then(dataOf);

export const fetchAuthorities = () =>
  axiosInstance.get("/authorities", catalogTimeout).then(dataOf);

export const createAuthority = (payload) =>
  axiosInstance.post("/authorities", payload).then(dataOf);

export const updateAuthority = (id, payload) =>
  axiosInstance.put(`/authorities/${id}`, payload).then(dataOf);

export const deleteAuthority = (id) =>
  axiosInstance.delete(`/authorities/${id}`).then(dataOf);

export const fetchPermitTypes = () =>
  axiosInstance.get("/permit-types", catalogTimeout).then(dataOf);

export const createPermitType = (payload) =>
  axiosInstance.post("/permit-types", payload).then(dataOf);

export const updatePermitType = (id, payload) =>
  axiosInstance.put(`/permit-types/${id}`, payload).then(dataOf);

export const deletePermitType = (id) =>
  axiosInstance.delete(`/permit-types/${id}`).then(dataOf);

export const fetchDocumentTypes = () =>
  axiosInstance.get("/document-types", catalogTimeout).then(dataOf);

export const createDocumentType = (payload) =>
  axiosInstance.post("/document-types", payload).then(dataOf);

export const updateDocumentType = (id, payload) =>
  axiosInstance.put(`/document-types/${id}`, payload).then(dataOf);

export const deleteDocumentType = (id) =>
  axiosInstance.delete(`/document-types/${id}`).then(dataOf);

export const fetchScopeTags = () =>
  axiosInstance.get("/scope-tags", catalogTimeout).then(dataOf);

export const createScopeTag = (payload) =>
  axiosInstance.post("/scope-tags", payload).then(dataOf);

export const updateScopeTag = (id, payload) =>
  axiosInstance.put(`/scope-tags/${id}`, payload).then(dataOf);

export const deleteScopeTag = (id) =>
  axiosInstance.delete(`/scope-tags/${id}`).then(dataOf);

export const fetchJurisdictionPacks = (selectableOnly = false) =>
  axiosInstance
    .get("/jurisdiction-packs", { ...catalogTimeout, params: { selectableOnly } })
    .then(dataOf);

export const fetchJurisdictionPack = (id) =>
  axiosInstance.get(`/jurisdiction-packs/${id}`).then(dataOf);

export const createJurisdictionPack = (payload) =>
  axiosInstance.post("/jurisdiction-packs", payload).then(dataOf);

export const updateJurisdictionPack = (id, payload) =>
  axiosInstance.put(`/jurisdiction-packs/${id}`, payload).then(dataOf);

export const deleteJurisdictionPack = (id) =>
  axiosInstance.delete(`/jurisdiction-packs/${id}`).then(dataOf);

export const fetchProjectPermitCases = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/permit-cases`).then(dataOf);

export const updatePermitCase = (caseId, payload) =>
  axiosInstance.patch(`/permit-cases/${caseId}`, payload).then(dataOf);

export const updatePermitDocument = (documentId, payload) =>
  axiosInstance.patch(`/permit-documents/${documentId}`, payload).then(dataOf);
