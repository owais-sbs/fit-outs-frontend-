import axiosInstance from "@/lib/axiosInstance";

export function normalizeProject(item = {}) {
  return {
    ...item,
    id: String(item.id),
    projectName: item.name || item.projectName || "",
    clientName: item.clientName || "—",
    clientId: item.clientId != null ? String(item.clientId) : null,
    leadId: item.leadId != null ? String(item.leadId) : null,
    leadReferenceNo: item.leadReferenceNo || "",
    projectType: item.projectType || "—",
    location: item.location || "—",
    description: item.description || "",
    assignedManager: item.assignedManager || "Unassigned",
    progress: item.progress ?? 0,
    status: item.status || "Planning",
    budget: item.budget ?? 0,
    startDate: item.startDate || null,
    expectedCompletionDate: item.expectedCompletionDate || null,
  };
}

export const fetchAllProjects = () =>
  axiosInstance.get("/projects").then((r) => {
    const data = r.data?.data ?? r.data;
    return (Array.isArray(data) ? data : []).map(normalizeProject);
  });

export const fetchProjectById = (id) =>
  axiosInstance.get(`/projects/${id}`).then((r) => normalizeProject(r.data?.data ?? r.data));

export const createProject = (form) =>
  axiosInstance
    .post("/projects", {
      name: (form.name || form.projectName || "").trim(),
      clientId: form.clientId ? Number(form.clientId) : null,
      companyId: form.companyId || null,
      status: form.status || "Planning",
      progress: form.progress != null ? Number(form.progress) : 0,
      budget: form.budget != null ? Number(form.budget) : undefined,
      location: form.location,
      description: form.description,
      projectType: form.projectType,
      assignedManager: form.assignedManager,
      startDate: form.startDate || null,
      expectedCompletionDate: form.expectedCompletionDate || null,
    })
    .then((r) => {
      const payload = r.data;
      if (payload && payload.isSuccess === false) {
        return Promise.reject(
          new Error(payload.error || payload.message || "Failed to create project")
        );
      }
      return normalizeProject(payload?.data ?? payload);
    });

export const updateProject = (id, payload) =>
  axiosInstance
    .put(`/projects/${id}`, {
      name: payload.name ?? payload.projectName,
      clientId: payload.clientId != null ? Number(payload.clientId) : undefined,
      status: payload.status,
      progress: payload.progress != null ? Number(payload.progress) : undefined,
      budget: payload.budget != null ? Number(payload.budget) : undefined,
      location: payload.location,
      description: payload.description,
      projectType: payload.projectType,
      assignedManager: payload.assignedManager,
      startDate: payload.startDate || null,
      expectedCompletionDate: payload.expectedCompletionDate || null,
      active: payload.isActive ?? payload.active,
    })
    .then((r) => normalizeProject(r.data?.data ?? r.data));
