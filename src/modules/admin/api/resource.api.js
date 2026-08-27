import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const fetchLabourCrews = () =>
  axiosInstance.get(`/labour-crews`).then(unwrap);

export const createLabourCrew = (payload) =>
  axiosInstance.post(`/labour-crews`, payload).then(unwrap);

export const updateLabourCrew = (uuid, payload) =>
  axiosInstance.put(`/labour-crews/${uuid}`, payload).then(unwrap);

export const deleteLabourCrew = (uuid) =>
  axiosInstance.delete(`/labour-crews/${uuid}`).then(unwrap);

export const fetchCrewAssignments = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/crew-assignments`).then(unwrap);

export const createCrewAssignment = (projectId, payload) =>
  axiosInstance.post(`/projects/${projectId}/crew-assignments`, payload).then(unwrap);

export const deleteCrewAssignment = (projectId, assignmentUuid) =>
  axiosInstance.delete(`/projects/${projectId}/crew-assignments/${assignmentUuid}`).then(unwrap);

export const fetchResourceUtilisation = (projectId) =>
  axiosInstance.get(`/projects/${projectId}/resource-utilisation`).then(unwrap);
