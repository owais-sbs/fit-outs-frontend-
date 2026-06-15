import axiosInstance from "@/lib/axiosInstance";

export function normalizeClient(item = {}) {
  return {
    id: String(item.id),
    fullName: item.fullName || "",
    email: item.email || "",
    phone: item.phone || "",
    companyName: item.companyName || "",
    companyUuid: item.companyUuid || null,
    active: item.active ?? true,
    roles: item.roles || [],
  };
}

export const fetchAllClients = () =>
  axiosInstance
    .get("/accounts/role/CLIENT")
    .then((r) => {
      const data = r.data?.data ?? r.data;
      return (Array.isArray(data) ? data : []).map(normalizeClient);
    });

export const fetchClientById = (id) =>
  axiosInstance
    .get(`/accounts/${id}`)
    .then((r) => normalizeClient(r.data?.data ?? r.data));

export const createClient = (form) =>
  axiosInstance
    .post("/accounts", {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone?.trim() || null,
      companyName: form.companyName?.trim() || null,
      companyUuid: form.companyUuid || null,
      roles: ["CLIENT"],
    })
    .then((r) => normalizeClient(r.data?.data ?? r.data));

export const updateClient = (id, form) =>
  axiosInstance
    .put(`/accounts/${id}`, {
      fullName: form.fullName.trim(),
      phone: form.phone?.trim() || null,
      companyName: form.companyName?.trim() || null,
      roles: ["CLIENT"],
      active: form.active ?? true,
    })
    .then((r) => normalizeClient(r.data?.data ?? r.data));

export const deactivateClient = (id) =>
  axiosInstance.delete(`/accounts/${id}`);
