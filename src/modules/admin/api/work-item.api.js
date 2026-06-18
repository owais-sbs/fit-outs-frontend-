import axiosInstance from "@/lib/axiosInstance";

export const fetchWorkItems = (filter = {}, page = 0, size = 10) => {
  // Convert pagination to 0-indexed for Spring Boot
  return axiosInstance
    .post(`/work-items/filter?page=${page}&size=${size}`, filter)
    .then((r) => r.data?.data ?? r.data);
};

export const createWorkItem = (data) => {
  return axiosInstance
    .post("/work-items", data)
    .then((r) => r.data?.data ?? r.data);
};

export const updateWorkItem = (id, data) => {
  return axiosInstance
    .put(`/work-items/${id}`, data)
    .then((r) => r.data?.data ?? r.data);
};

export const deleteWorkItem = (id) => {
  return axiosInstance
    .delete(`/work-items/${id}`)
    .then((r) => r.data?.data ?? r.data);
};

export const activateWorkItem = (id) => {
  return axiosInstance
    .patch(`/work-items/${id}/activate`)
    .then((r) => r.data?.data ?? r.data);
};

export const deactivateWorkItem = (id) => {
  return axiosInstance
    .patch(`/work-items/${id}/deactivate`)
    .then((r) => r.data?.data ?? r.data);
};

export const cloneWorkItem = (id) => {
  return axiosInstance
    .post(`/work-items/${id}/clone`)
    .then((r) => r.data?.data ?? r.data);
};

export const fetchWorkItemMasters = () => {
  return axiosInstance
    .get("/work-item-masters")
    .then((r) => r.data?.data ?? r.data);
};

export const createWorkItemMaster = (data) => {
  return axiosInstance
    .post("/work-item-masters", data)
    .then((r) => r.data?.data ?? r.data);
};

export const updateWorkItemMaster = (id, data) => {
  return axiosInstance
    .put(`/work-item-masters/${id}`, data)
    .then((r) => r.data?.data ?? r.data);
};

export const deleteWorkItemMaster = (id) => {
  return axiosInstance
    .delete(`/work-item-masters/${id}`)
    .then((r) => r.data?.data ?? r.data);
};
