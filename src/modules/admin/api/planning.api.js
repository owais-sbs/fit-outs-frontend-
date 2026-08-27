import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchPlanningStatus = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/planning`).then(unwrap);

export const updatePlanningStatus = (projectId, payload) =>
  axiosInstance.put(`/projects/${projectId}/planning`, payload).then(unwrap);

/** Company-level planning gate config (admin). */
export const fetchPlanningGates = () =>
  axiosInstance.get(`/company/planning-gates`).then(unwrap);

export const updatePlanningGates = (payload) =>
  axiosInstance.put(`/company/planning-gates`, payload).then(unwrap);

/** Planning decision audit trail for a project. */
export const fetchPlanningAudit = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/planning/audit`).then(unwrap);
