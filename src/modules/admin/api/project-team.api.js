import axiosInstance from "@/lib/axiosInstance";

const unwrap = (r) => r.data?.data ?? r.data;

export const PROJECT_TEAM_ROLES = [
  { key: "QS_SENIOR_QS", label: "QS / Senior QS" },
  { key: "PROJECT_MANAGER", label: "Project Manager" },
  { key: "FINANCE", label: "Finance" },
  { key: "CLIENT", label: "Client" },
  { key: "SUBCONTRACTOR", label: "Subcontractor" },
];

export function normalizeTeamAssignment(item = {}) {
  return {
    uuid: item.uuid || null,
    projectId: item.projectId,
    accountId: String(item.accountId),
    role: item.role || "",
    roleLabel: item.roleLabel || item.role || "",
    displayName: item.displayName || "",
    email: item.email || "",
  };
}

export const fetchProjectTeamAssignments = (projectId) =>
  axiosInstance
    .get(`/projects/${projectId}/team-assignments`)
    .then((r) => {
      const data = unwrap(r);
      return (Array.isArray(data) ? data : []).map(normalizeTeamAssignment);
    });

export const syncProjectTeamAssignments = (projectId, assignments) =>
  axiosInstance
    .put(`/projects/${projectId}/team-assignments`, { assignments })
    .then((r) => {
      const data = unwrap(r);
      return (Array.isArray(data) ? data : []).map(normalizeTeamAssignment);
    });
