import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

export function normalizeSubcontractor(item = {}) {
  return {
    id: String(item.id),
    fullName: item.fullName || "",
    email: item.email || "",
    phone: item.phone || "",
    companyName: item.companyName || "",
    active: item.active ?? true,
    roles: item.roles || [],
  };
}

export const fetchAllSubcontractors = () =>
  axiosInstance
    .get("/accounts/role/SUBCONTRACTOR")
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return (Array.isArray(data) ? data : []).map(normalizeSubcontractor);
    });

export const fetchScPackages = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/sc-packages`).then(unwrap);

export const createScPackage = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages`, payload).then(unwrap);

export const updateScPackage = (projectId, uuid, payload) =>
  axiosInstance.put(`/projects/${projectId}/sc-packages/${uuid}`, payload).then(unwrap);

export const deleteScPackage = (projectId, uuid) =>
  axiosInstance.delete(`/projects/${projectId}/sc-packages/${uuid}`).then(unwrap);

export const appointScPackage = (projectId, uuid, payload) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages/${uuid}/appoint`, payload).then(unwrap);

export const generateScPackagesFromBoq = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/sc-packages/generate-from-boq`).then(unwrap);

export const fetchProjectScClaims = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/sc-claims`).then(unwrap);

export const approveScClaim = (projectId, uuid) =>
  axiosInstance.post(`/projects/${projectId}/sc-claims/${uuid}/approve`).then(unwrap);

export const rejectScClaim = (projectId, uuid, reason) =>
  axiosInstance
    .post(`/projects/${projectId}/sc-claims/${uuid}/reject`, reason ? { reason } : {})
    .then(unwrap);

export const fetchMyScPackages = () =>
  axiosInstance.get(`/subcontractor/my-packages`).then(unwrap);

export const fetchMyScProjects = () =>
  axiosInstance.get(`/subcontractor/my-projects`).then(unwrap);

export const fetchMyScProject = (projectId) =>
  axiosInstance.get(`/subcontractor/projects/${projectId}`).then(unwrap);

export const fetchPackageClaims = (packageUuid) =>
  axiosInstance.get(`/subcontractor/packages/${packageUuid}/claims`).then(unwrap);

export const createScClaim = (packageUuid, payload) =>
  axiosInstance.post(`/subcontractor/packages/${packageUuid}/claims`, payload).then(unwrap);

export const submitScClaim = (claimUuid) =>
  axiosInstance.post(`/subcontractor/claims/${claimUuid}/submit`).then(unwrap);

export const uploadScClaimAttachment = (claimUuid, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post(`/subcontractor/claims/${claimUuid}/attachments`, fd, multipartConfig({ timeout: 120000 }))
    .then((r) => {
      if (r.data?.isSuccess === false) {
        const err = new Error(r.data?.error || r.data?.message || "Upload failed");
        err.response = r;
        throw err;
      }
      return r.data?.data ?? r.data;
    });
};
