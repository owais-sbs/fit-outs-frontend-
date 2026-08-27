import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchMaterialPlan = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/material-plan`).then(unwrap);

export const generateMaterialPlan = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/material-plan/generate`).then(unwrap);

export const updateMaterialPlan = (projectId, payload) =>
  axiosInstance.put(`/projects/${projectId}/material-plan`, payload).then(unwrap);

export const reserveMaterialPlan = (projectId) =>
  axiosInstance.post(`/projects/${projectId}/material-plan/reserve`).then(unwrap);

/** Download CSV export as a blob (falls back to window.open if needed). */
export const exportMaterialPlanCsv = async (projectId) => {
  const res = await axiosInstance.get(`/projects/${projectId}/material-plan/export.csv`, {
    responseType: "blob",
  });
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `material-plan-${projectId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return blob;
};

export const openMaterialPlanCsv = (projectId) => {
  const base = axiosInstance.defaults.baseURL || "/api";
  const path = `${String(base).replace(/\/$/, "")}/projects/${projectId}/material-plan/export.csv`;
  window.open(path, "_blank", "noopener,noreferrer");
};
