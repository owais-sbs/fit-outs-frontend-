export const ROLES = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  BUSINESS_OWNER: "business-owner",
  PROJECT_MANAGER: "project-manager",
  DESIGNER: "designer",
  QAS: "qas",
  QS: "qs",
  SENIOR_QS: "senior-qs",
  FINANCE: "finance",
  SUBCONTRACTOR: "subcontractor",
  CLIENT: "client",
  SALES: "sales",
  EMPLOYEE: "employee",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.BUSINESS_OWNER]: "Director",
  [ROLES.PROJECT_MANAGER]: "Project Manager",
  [ROLES.DESIGNER]: "Designer",
  [ROLES.QAS]: "QAS",
  [ROLES.QS]: "Quantity Surveyor",
  [ROLES.SENIOR_QS]: "Senior QS",
  [ROLES.FINANCE]: "Finance",
  [ROLES.SUBCONTRACTOR]: "Subcontractor",
  [ROLES.CLIENT]: "Client",
  [ROLES.SALES]: "Sales",
  [ROLES.EMPLOYEE]: "Employee",
};

const BOQ_READ = ["boq.read"];
const BOQ_WRITE = ["boq.read", "boq.write"];
const BOQ_SUBMIT = ["boq.read", "boq.write", "boq.submit"];
const BOQ_APPROVE = ["boq.read", "boq.approve"];

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ["*"],
  [ROLES.ADMIN]: [
    "users.read",
    "users.write",
    "projects.read",
    "projects.write",
    "reports.read",
    "settings.read",
    "settings.write",
    ...BOQ_SUBMIT,
    ...BOQ_APPROVE,
  ],
  [ROLES.BUSINESS_OWNER]: [
    "users.read",
    "projects.read",
    "projects.write",
    "leads.read",
    "clients.read",
    "finance.read",
    "reports.read",
    "settings.read",
    ...BOQ_READ,
    ...BOQ_SUBMIT,
    ...BOQ_APPROVE,
  ],
  [ROLES.PROJECT_MANAGER]: [
    "projects.read",
    "projects.write",
    "tasks.read",
    "tasks.write",
    "team.read",
    "reports.read",
    ...BOQ_READ,
    ...BOQ_APPROVE,
  ],
  [ROLES.DESIGNER]: [
    "projects.read",
    "tasks.read",
    "tasks.write",
    "designs.read",
    "designs.write",
  ],
  [ROLES.QAS]: [
    "projects.read",
    "tasks.read",
    "tasks.write",
    "quality.read",
    "quality.write",
  ],
  [ROLES.QS]: [
    "projects.read",
    "projects.write",
    ...BOQ_SUBMIT,
  ],
  [ROLES.SENIOR_QS]: [
    "projects.read",
    "projects.write",
    ...BOQ_SUBMIT,
    ...BOQ_APPROVE,
  ],
  [ROLES.FINANCE]: [
    "finance.read",
    "finance.write",
    "invoices.read",
    "invoices.write",
    "reports.read",
  ],
  [ROLES.SUBCONTRACTOR]: [
    "tasks.read",
    "tasks.write",
    "documents.read",
    "documents.write",
  ],
  [ROLES.CLIENT]: [
    "projects.read",
    "documents.read",
    "invoices.read",
    "communications.read",
    "communications.write",
    ...BOQ_READ,
    ...BOQ_APPROVE,
  ],
  [ROLES.SALES]: [
    "leads.read",
    "leads.write",
    "clients.read",
    "clients.write",
    "proposals.read",
    "proposals.write",
    ...BOQ_READ,
  ],
  [ROLES.EMPLOYEE]: [
    "projects.read",
    "tasks.read",
    "tasks.write",
  ],
};

export const BOQ_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_SENIOR_QS: "Pending Senior QS",
  PENDING_PM: "Pending PM",
  PENDING_DIRECTOR: "Pending Director",
  PENDING_CLIENT: "Pending Client",
  APPROVED: "Approved",
  FINAL: "Approved",
  REJECTED: "Rejected",
};

export function boqStatusLabel(status) {
  if (!status) return "Draft";
  const key = String(status).toUpperCase().replace(/-/g, "_");
  return BOQ_STATUS_LABELS[key] || status;
}

export function canSubmitBoq(role) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes("boq.submit");
}

export function canApproveBoq(role) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes("boq.approve");
}
