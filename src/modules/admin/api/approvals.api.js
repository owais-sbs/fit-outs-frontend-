import axiosInstance from "@/lib/axiosInstance";
import { multipartConfig } from "@/lib/multipart";

const unwrap = (r) => r.data?.data ?? r.data;

// Reference library

export const fetchAuthorities = (params = {}) =>
  axiosInstance.get("/approvals/authorities", { params }).then(unwrap);

export const createAuthority = (payload) =>
  axiosInstance.post("/approvals/authorities", payload).then(unwrap);

export const updateAuthority = (uuid, payload) =>
  axiosInstance.put(`/approvals/authorities/${uuid}`, payload).then(unwrap);

export const fetchJurisdictions = (params = {}) =>
  axiosInstance.get("/approvals/jurisdictions", { params }).then(unwrap);

export const createJurisdiction = (payload) =>
  axiosInstance.post("/approvals/jurisdictions", payload).then(unwrap);

export const updateJurisdiction = (uuid, payload) =>
  axiosInstance.put(`/approvals/jurisdictions/${uuid}`, payload).then(unwrap);

export const fetchPermitTypes = (params = {}) =>
  axiosInstance.get("/approvals/permit-types", { params }).then(unwrap);

export const createPermitType = (payload) =>
  axiosInstance.post("/approvals/permit-types", payload).then(unwrap);

export const updatePermitType = (uuid, payload) =>
  axiosInstance.put(`/approvals/permit-types/${uuid}`, payload).then(unwrap);

export const fetchDocumentTypes = (params = {}) =>
  axiosInstance.get("/approvals/document-types", { params }).then(unwrap);

// Company compliance

export const fetchCompanyCompliance = () =>
  axiosInstance.get("/approvals/compliance/company").then(unwrap);

export const saveCompanyCompliance = (payload) =>
  axiosInstance.put("/approvals/compliance/company", payload).then(unwrap);

// Seed

export const fetchSeedStatus = () =>
  axiosInstance.get("/approvals/seed/status").then(unwrap);

export const importSeed = () =>
  axiosInstance.post("/approvals/seed/import").then(unwrap);

export const importSeedUpload = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance
    .post("/approvals/seed/import-upload", fd, multipartConfig({ timeout: 120000 }))
    .then(unwrap);
};

// Project approval cases

export const resolveProjectApprovals = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/approvals/resolve`, payload ?? {}).then(unwrap);

export const generateProjectApprovals = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/approvals/generate`, payload ?? {}).then(unwrap);

export const fetchProjectApprovals = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/approvals`).then(unwrap);

export const fetchApprovalCase = (caseUuid) =>
  axiosInstance.get(`/approval-cases/${caseUuid}`).then(unwrap);

export const patchApprovalCase = (caseUuid, payload) =>
  axiosInstance.patch(`/approval-cases/${caseUuid}`, payload).then(unwrap);

export const attachChecklistItem = (caseUuid, itemUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/checklist/${itemUuid}/attach`, payload).then(unwrap);

export const waiveChecklistItem = (caseUuid, itemUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/checklist/${itemUuid}/waive`, payload).then(unwrap);

export const assemblePack = (caseUuid) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/assemble-pack`).then(unwrap);

export const createCaseSubmission = (caseUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/submissions`, payload).then(unwrap);

export const createCaseComment = (caseUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/comments`, payload).then(unwrap);

export const createCaseFee = (caseUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/fees`, payload).then(unwrap);

export const renewApprovalCase = (caseUuid, payload) =>
  axiosInstance.post(`/approval-cases/${caseUuid}/renew`, payload ?? {}).then(unwrap);

// Portfolio views

export const fetchApprovalDashboard = (params = {}) =>
  axiosInstance.get("/approvals/dashboard", { params }).then(unwrap);

export const fetchDeposits = (params = {}) =>
  axiosInstance.get("/deposits", { params }).then(unwrap);

export const fetchSlaAnalytics = () =>
  axiosInstance.get("/approvals/analytics/sla").then(unwrap);
