import axiosInstance from "@/lib/axiosInstance";

export function normalizeAppendix(item = {}) {
  return {
    uuid: item.uuid || null,
    title: item.title || "",
    description: item.description || "",
    imageUrl: item.imageUrl || "",
    category: item.category || "",
    sortOrder: item.sortOrder ?? 0,
    active: item.active !== false,
    createdAt: item.createdAt || null,
  };
}

export const fetchAppendixMasters = (all = false) =>
  axiosInstance
    .get(`/appendix-masters${all ? "?all=true" : ""}`)
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return Array.isArray(data) ? data.map(normalizeAppendix) : [];
    });

export const createAppendixMaster = (form, file) => {
  const body = new FormData();
  body.append("title", form.title);
  body.append("file", file);
  if (form.description) body.append("description", form.description);
  if (form.category) body.append("category", form.category);
  if (form.sortOrder != null) body.append("sortOrder", String(form.sortOrder));
  return axiosInstance
    .post("/appendix-masters", body, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => normalizeAppendix(r.data?.data ?? r.data));
};

export const updateAppendixMaster = (id, form, file) => {
  const body = new FormData();
  if (form.title) body.append("title", form.title);
  if (file) body.append("file", file);
  if (form.description != null) body.append("description", form.description);
  if (form.category != null) body.append("category", form.category);
  if (form.sortOrder != null) body.append("sortOrder", String(form.sortOrder));
  if (form.active != null) body.append("active", String(form.active));
  return axiosInstance
    .put(`/appendix-masters/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => normalizeAppendix(r.data?.data ?? r.data));
};

export const deleteAppendixMaster = (id) =>
  axiosInstance.delete(`/appendix-masters/${id}`).then((r) => r.data);
