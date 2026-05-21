export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export", "manage"];

export const PERMISSION_MODULES = [
  { id: "crm", label: "CRM" },
  { id: "site-visits", label: "Site Visits" },
  { id: "reports", label: "Reports" },
  { id: "billing", label: "Billing" },
  { id: "users", label: "Users" },
  { id: "dashboard", label: "Dashboard" },
  { id: "plans", label: "Plans" },
];

export const MATRIX_USERS = [
  { id: "u1", name: "Sarah Chen", role: "Company Admin" },
  { id: "u2", name: "James Wu", role: "Project Manager" },
  { id: "u3", name: "Emma Walsh", role: "Company Admin" },
  { id: "u4", name: "Michael Torres", role: "Finance" },
];

/** key: `${userId}-${moduleId}-${action}` */
export const DEFAULT_PERMISSIONS = {
  "u1-crm-view": true, "u1-crm-create": true, "u1-crm-edit": true, "u1-crm-delete": true, "u1-crm-export": true, "u1-crm-manage": true,
  "u1-reports-view": true, "u1-reports-export": true,
  "u2-crm-view": true, "u2-crm-edit": true, "u2-site-visits-view": true, "u2-site-visits-create": true,
  "u3-crm-view": true, "u3-dashboard-view": true,
  "u4-billing-view": true, "u4-billing-manage": true, "u4-reports-view": true, "u4-reports-export": true,
};
