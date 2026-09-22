import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const CLOSEOUT_ITEM_KEYS = {
  VARIATIONS: "VARIATIONS",
  SNAGS: "SNAGS",
  FINAL_INVOICE: "FINAL_INVOICE",
  ACCOUNTING: "ACCOUNTING",
};

export const fetchCloseoutChecklist = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/completion/close-out`).then(unwrap);

export const fetchFinalAccount = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/completion/final-account`).then(unwrap);

export const confirmCloseoutFinalInvoice = (projectId, confirmed = true) =>
  axiosInstance
    .post(`/projects/${projectId}/completion/close-out/final-invoice`, { confirmed })
    .then(unwrap);

export const confirmCloseoutAccounting = (projectId, confirmed = true) =>
  axiosInstance
    .post(`/projects/${projectId}/completion/close-out/accounting`, { confirmed })
    .then(unwrap);

export const saveCloseoutCarriedSnags = (projectId, snagUuids = []) =>
  axiosInstance
    .post(`/projects/${projectId}/completion/close-out/carried-snags`, { snagUuids })
    .then(unwrap);

export const commerciallyCloseProject = (projectId, body) =>
  axiosInstance.post(`/projects/${projectId}/completion/commercially-close`, body).then(unwrap);

export const updateProjectDlp = (projectId, body) =>
  axiosInstance.patch(`/projects/${projectId}/completion/dlp`, body).then(unwrap);

export const archiveProject = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/completion/archive`).then(unwrap);
