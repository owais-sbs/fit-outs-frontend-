import { getAllEmployees, getEmployeeById } from "../data/employees";

// NOTE: Using mock data — replace with axiosInstance calls when backend is ready.
// Pattern mirrors leads.api.js for easy swap.

const MOCK_AVATARS = {
  "emp-001": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "emp-002": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  "emp-003": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "emp-004": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  "emp-005": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
  "emp-006": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  "emp-007": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face",
  "emp-008": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  "emp-009": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "emp-010": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
};

export function normalizeEmployee(item = {}) {
  const idStr = String(item.id);
  return {
    ...item,
    id: idStr,
    fullName: item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
    status: (item.status || "active").toLowerCase(),
    avatar: MOCK_AVATARS[idStr] || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.fullName || "")}&background=7C3AED&color=ffffff&size=80&bold=true`
  };
}

export const fetchAllEmployees = () =>
  Promise.resolve(getAllEmployees().map(normalizeEmployee));

export const fetchEmployeeById = (id) => {
  const emp = getEmployeeById(id);
  if (!emp) return Promise.reject(new Error("Employee not found"));
  return Promise.resolve(normalizeEmployee(emp));
};

export const createEmployee = (form) => {
  const newEmployee = normalizeEmployee({ ...form, id: `emp-${Date.now()}` });
  return Promise.resolve(newEmployee);
};

export const updateEmployee = (id, form) => {
  const existing = getEmployeeById(id);
  if (!existing) return Promise.reject(new Error("Employee not found"));
  return Promise.resolve(normalizeEmployee({ ...existing, ...form }));
};

export const deleteEmployee = (id) => Promise.resolve({ id });
