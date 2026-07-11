import axiosInstance from "@/lib/axiosInstance";

export const fetchMaterialCategories = () =>
  axiosInstance.get("/material-categories").then((r) => r.data?.data ?? r.data);

export const createMaterialCategory = (data) =>
  axiosInstance.post("/material-categories", data).then((r) => r.data?.data ?? r.data);

export const updateMaterialCategory = (id, data) =>
  axiosInstance.put(`/material-categories/${id}`, data).then((r) => r.data?.data ?? r.data);

export const deleteMaterialCategory = (id) =>
  axiosInstance.delete(`/material-categories/${id}`).then((r) => r.data?.data ?? r.data);

export const fetchMaterials = (filter = {}, page = 0, size = 100) =>
  axiosInstance
    .post(`/materials/filter?page=${page}&size=${size}`, filter)
    .then((r) => r.data?.data ?? r.data);

export const createMaterial = (data) =>
  axiosInstance.post("/materials", data).then((r) => r.data?.data ?? r.data);

export const updateMaterial = (id, data) =>
  axiosInstance.put(`/materials/${id}`, data).then((r) => r.data?.data ?? r.data);

export const deleteMaterial = (id) =>
  axiosInstance.delete(`/materials/${id}`).then((r) => r.data?.data ?? r.data);
