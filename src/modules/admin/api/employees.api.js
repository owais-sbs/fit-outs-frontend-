import axiosInstance from "@/lib/axiosInstance";
import { fromBackendRole, roleLabel, toBackendRole } from "@/shared/constants/roles";

export function normalizeEmployee(item = {}) {
  const role = fromBackendRole(item.role);
  return {
    ...item,
    id: String(item.id),
    employeeName: item.employeeName || "",
    fullName: item.employeeName || "",
    isActive: item.active ?? true,
    features: item.features || [],
    role,
    roleLabel: roleLabel(role || item.role),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.employeeName || "")}&background=7C3AED&color=ffffff&size=80&bold=true`,
  };
}

export const fetchAllEmployees = () =>
  axiosInstance.get("/employees").then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeEmployee);
  });

export const fetchEmployeeById = (id) =>
  axiosInstance.get(`/employees/${id}`).then((r) => normalizeEmployee(r.data?.data ?? r.data));

export const createEmployee = (form) =>
  axiosInstance
    .post("/employees", {
      employeeName: form.employeeName.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || null,
      designation: form.designation?.trim() || null,
      role: toBackendRole(form.role),
      features: form.features || [],
    })
    .then((r) => normalizeEmployee(r.data?.data ?? r.data));

export const updateEmployee = (id, form) =>
  axiosInstance
    .put(`/employees/${id}`, {
      employeeName: form.employeeName?.trim(),
      phone: form.phone?.trim() || null,
      designation: form.designation?.trim(),
      role: form.role ? toBackendRole(form.role) : undefined,
      features: form.features,
      active: form.active ?? form.isActive ?? true,
    })
    .then((r) => normalizeEmployee(r.data?.data ?? r.data));

export const deleteEmployee = (id) =>
  axiosInstance.delete(`/employees/${id}`).then((r) => r.data?.data);
