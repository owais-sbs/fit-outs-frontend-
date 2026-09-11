import { ROLES } from "./roles";

export const ROUTES = {
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    SET_PASSWORD: "/set-password",
  },
  SUPER_ADMIN: {
    DASHBOARD: "/super-admin",
    TENANTS: "/super-admin/tenants",
    TENANTS_CREATE: "/super-admin/tenants/new",
    TENANT_DETAIL: "/super-admin/tenants/:tenantId",
    PLANS: "/super-admin/plans",
    USERS: "/super-admin/users",
    PERMISSIONS: "/super-admin/permissions",
    REPORTS: "/super-admin/reports",
    SITE_VISITS: "/super-admin/site-visits",
    SITE_VISIT_SCHEDULE: "/super-admin/site-visits/schedule",
    SITE_VISIT_REPORT: "/super-admin/site-visits/:visitId/report",
    SETTINGS: "/super-admin/settings",
    TERMS: "/super-admin/terms",
    AUDIT_LOG: "/super-admin/audit-log",
    ORGANIZATIONS: "/super-admin/organizations",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    LEADS_LIST: "/admin/leads",
    LEADS_NEW: "/admin/leads/new",
    LEADS_QUALIFIED: "/admin/leads/qualified",
    LEAD_DETAIL: "/admin/leads/:leadId",
    FOLLOW_UPS: "/admin/follow-ups",
    FOLLOW_UP_DETAIL: "/admin/follow-ups/:followUpId",
    LEAD_SOURCES: "/admin/lead-sources",
    LOST_LEADS: "/admin/lost-leads",
    SITE_VISITS: "/admin/site-visits",
    SITE_VISIT_SCHEDULE: "/admin/site-visits/schedule",
    SITE_VISIT_REPORT: "/admin/site-visits/:visitId/report",
    EMPLOYEES: "/admin/employees",
    EMPLOYEE_NEW: "/admin/employees/new",
    EMPLOYEE_DETAIL: "/admin/employees/:employeeId",
    CALENDAR: "/admin/calendar",
    PROJECTS: "/admin/projects",
    SCHEDULE_HUB: "/admin/schedule",
    SCHEDULE_TEMPLATES: "/admin/schedule/templates",
    PROJECT_CREATE: "/admin/projects/new",
    PROJECT_DETAIL: "/admin/projects/:projectId",
    PROJECT_DRAWINGS: "/admin/projects/:projectId/drawings",
    PROJECT_QTO: "/admin/projects/:projectId/drawings/:drawingId/qto",
    PROJECT_ROOM_TASK: "/admin/projects/:projectId/room-tasks/:taskId",
    PROJECT_ROOM_CHAT: "/admin/projects/:projectId/rooms/:roomId/chat",
    PROJECT_SCHEDULE: "/admin/projects/:projectId/schedule",
    PROJECT_MATERIAL_PLAN: "/admin/projects/:projectId/material-plan",
    PROJECT_RESOURCE_PLAN: "/admin/projects/:projectId/resource-plan",
    PROJECT_VALIDATION: "/admin/projects/:projectId/validation",
    PROJECT_SNAGS: "/admin/projects/:projectId/snags",
    PROJECT_DOCUMENTS: "/admin/projects/:projectId/documents",
    PROJECT_REPORTING: "/admin/projects/:projectId/reporting",
    PROJECT_BILLING: "/admin/projects/:projectId/billing",
    PROJECT_SUBCONTRACTORS: "/admin/projects/:projectId/subcontractors",
    VENDORS: "/admin/subcontractors/vendors",
    VALIDATION_INBOX: "/admin/validation/inbox",
    QUALITY_TEMPLATES: "/admin/quality-templates",
    APPROVALS_DASHBOARD: "/admin/approvals",
    DEPOSIT_LEDGER: "/admin/approvals/deposits",
    PROJECT_APPROVALS: "/admin/projects/:projectId/approvals",
    PROJECT_REQUESTS: "/admin/leads/project-requests",
    CLIENTS: "/admin/clients",
    CLIENT_DETAIL: "/admin/clients/:clientId",
    CLIENT_NEW: "/admin/clients/new",
    CLIENT_EMAIL: "/admin/clients/email",
    CLIENT_CALLS: "/admin/clients/calls",
    COMMUNICATIONS: "/admin/communications",
    ROOM_CONFIG: "/admin/project-configuration/room",
    WORK_ITEM_CONFIG: "/admin/project-configuration/work-item",
    MATERIAL_CONFIG: "/admin/project-configuration/materials",
    APPENDIX_CONFIG: "/admin/project-configuration/appendices",
    COVER_LETTER_CONFIG: "/admin/project-configuration/cover-letter",
    APPROVALS_CONFIG: "/admin/project-configuration/approvals",
    PROCUREMENT_STOCK: "/admin/procurement/stock",
    PROCUREMENT_RECEIPT: "/admin/procurement/receipt",
    PROCUREMENT_ISSUE: "/admin/procurement/issue",
    PROCUREMENT_MOVEMENTS: "/admin/procurement/movements",
    BOQ: "/admin/boq",
    BOQ_VIEW: "/admin/boq/:boqId",
    BOQ_INBOX: "/admin/boq/inbox",
    QAS: "/admin/qas",
    SETTINGS: "/admin/settings",
    TERMS: "/admin/terms",
  },
  BUSINESS_OWNER: {
    DASHBOARD: "/business-owner",
    BOQ_INBOX: "/business-owner/boq/inbox",
    BOQ_VIEW: "/business-owner/boq/:boqId",
    BILLING_MILESTONE_INBOX: "/business-owner/billing/inbox",
    PROJECTS: "/business-owner/projects",
    PROJECT_BILLING: "/business-owner/projects/:projectId/billing",
    PROCUREMENT: "/business-owner/procurement",
    COMMERCIAL: "/business-owner/commercial",
    CRM: "/business-owner/crm",
    FINANCE: "/business-owner/finance",
    REPORTS: "/business-owner/reports",
    SETTINGS: "/business-owner/settings",
    TERMS: "/business-owner/terms",
  },
  PROJECT_MANAGER: {
    DASHBOARD: "/project-manager",
    BOQ_INBOX: "/project-manager/boq/inbox",
    BOQ_VIEW: "/project-manager/boq/:boqId",
    BILLING_MILESTONE_INBOX: "/project-manager/billing/inbox",
    PROJECTS: "/project-manager/projects",
    SCHEDULE_HUB: "/project-manager/schedule",
    SCHEDULE_TEMPLATES: "/project-manager/schedule/templates",
    PROJECT_DETAIL: "/project-manager/projects/:projectId",
    PROJECT_DRAWINGS: "/project-manager/projects/:projectId/drawings",
    PROJECT_QTO: "/project-manager/projects/:projectId/drawings/:drawingId/qto",
    PROJECT_SCHEDULE: "/project-manager/projects/:projectId/schedule",
    PROJECT_MATERIAL_PLAN: "/project-manager/projects/:projectId/material-plan",
    PROJECT_RESOURCE_PLAN: "/project-manager/projects/:projectId/resource-plan",
    PROJECT_VALIDATION: "/project-manager/projects/:projectId/validation",
    PROJECT_SNAGS: "/project-manager/projects/:projectId/snags",
    PROJECT_DOCUMENTS: "/project-manager/projects/:projectId/documents",
    PROJECT_REPORTING: "/project-manager/projects/:projectId/reporting",
    PROJECT_BILLING: "/project-manager/projects/:projectId/billing",
    PROJECT_SUBCONTRACTORS: "/project-manager/projects/:projectId/subcontractors",
    VENDORS: "/project-manager/subcontractors/vendors",
    VALIDATION_INBOX: "/project-manager/validation/inbox",
    QUALITY_TEMPLATES: "/project-manager/quality-templates",
    APPROVALS_DASHBOARD: "/project-manager/approvals",
    DEPOSIT_LEDGER: "/project-manager/approvals/deposits",
    PROJECT_APPROVALS: "/project-manager/projects/:projectId/approvals",
    SITE_VISITS: "/project-manager/site-visits",
    SITE_VISIT_REPORT: "/project-manager/site-visits/:visitId/report",
    COMMUNICATIONS: "/project-manager/communications",
    TASKS: "/project-manager/tasks",
    TEAM: "/project-manager/team",
    REPORTS: "/project-manager/reports",
    TERMS: "/project-manager/terms",
  },
  DESIGNER: {
    DASHBOARD: "/designer",
    PROJECTS: "/designer/projects",
    TASKS: "/designer/tasks",
    DESIGNS: "/designer/designs",
  },
  QAS: {
    DASHBOARD: "/qas",
    PROJECTS: "/qas/projects",
    TASKS: "/qas/tasks",
    INSPECTIONS: "/qas/inspections",
    REPORTS: "/qas/reports",
  },
  FINANCE: {
    DASHBOARD: "/finance",
    PROJECTS: "/finance/projects",
    PROJECT_DETAIL: "/finance/projects/:projectId",
    PROJECT_BILLING: "/finance/projects/:projectId/billing",
    BILLING_MILESTONE_INBOX: "/finance/billing/inbox",
    BOQ_INBOX: "/finance/boq/inbox",
    BOQ_VIEW: "/finance/boq/:boqId",
    TERMS: "/finance/terms",
  },
  SUBCONTRACTOR: {
    DASHBOARD: "/subcontractor",
    PROJECTS: "/subcontractor/projects",
    PROJECT_DETAIL: "/subcontractor/projects/:projectId",
    LOCATIONS: "/subcontractor/locations",
    PACKAGES: "/subcontractor/packages",
    TASKS: "/subcontractor/tasks",
    CLAIMS: "/subcontractor/claims",
    PROGRESS_LOGS: "/subcontractor/progress-logs",
    DOCUMENTS: "/subcontractor/documents",
    PAYMENTS: "/subcontractor/payments",
    VARIATIONS: "/subcontractor/variations",
    SITE_REPORTS: "/subcontractor/site-reports",
    BOQ: "/subcontractor/boq",
    RFQ: "/subcontractor/rfq",
    RFQ_DETAIL: "/subcontractor/rfq/:packageUuid",
    CLARIFICATIONS: "/subcontractor/clarifications",
    MY_BIDS: "/subcontractor/my-bids",
    AWARD_PACKS: "/subcontractor/award-packs",
    MATERIAL_REQUESTS: "/subcontractor/material-requests",
    SNAGS: "/subcontractor/snags",
    INSPECTIONS: "/subcontractor/inspections",
    HSE: "/subcontractor/hse",
    CERTIFICATES: "/subcontractor/certificates",
    RETENTION: "/subcontractor/retention",
    BACK_CHARGES: "/subcontractor/back-charges",
    SCORECARD: "/subcontractor/scorecard",
    AWARDS: "/subcontractor/awards",
    NOTIFICATIONS: "/subcontractor/notifications",
    SUBMITTALS: "/subcontractor/submittals",
    REVIEW_STATUS: "/subcontractor/review-status",
    AS_BUILTS: "/subcontractor/as-builts",
    DRAWING_REGISTER: "/subcontractor/drawing-register",
    COMPANY_PROFILE: "/subcontractor/company",
    ORG_EXTRAS: "/subcontractor/organization",
    WORKERS: "/subcontractor/workers",
    TEAM: "/subcontractor/team",
  },
  CLIENT: {
    DASHBOARD: "/client",
    PROJECTS: "/client/projects",
    PROJECTS_MY: "/client/projects/my",
    PROJECTS_REQUEST: "/client/projects/request",
    PROJECT_DETAIL: "/client/projects/:projectId",
    PROJECT_SCHEDULE: "/client/projects/:projectId/schedule",
    PROJECT_ROOM_TASK: "/client/projects/:projectId/room-tasks/:taskId",
    PROJECT_ROOM_CHAT: "/client/projects/:projectId/rooms/:roomId/chat",
    DOCUMENTS: "/client/documents",
    SNAGS: "/client/snags",
    INVOICES: "/client/invoices",
    COMMUNICATIONS: "/client/communications",
    DESIGNS: "/client/designs",
    DESIGN_DETAIL: "/client/designs/:id",
    DESIGNS_PENDING: "/client/designs/pending",
    DESIGNS_REVISIONS: "/client/designs/revisions",
    DESIGNS_APPROVED: "/client/designs/approved",
    BOQ_APPROVALS: "/client/boq-approvals",
    BOQ_VIEW: "/client/boq/:boqId",
    SETTINGS: "/client/settings",
    TERMS: "/client/terms",
  },
  SALES: {
    DASHBOARD: "/sales",
    LEADS: "/sales/leads",
    CLIENTS: "/sales/clients",
    PROPOSALS: "/sales/proposals",
    REPORTS: "/sales/reports",
  },
  EMPLOYEE: {
    DASHBOARD: "/employee",
    PROJECTS: "/employee/projects",
    ACTIVITIES: "/employee/activities",
    CALENDAR: "/employee/calendar",
    SITE_VISITS: "/employee/site-visits",
    SITE_VISIT_REPORT: "/employee/site-visits/:visitId/report",
    COMMUNICATIONS: "/employee/communications",
    TERMS: "/employee/terms",
  },
};

/** Resolve admin / PM / finance route set from the current URL. */
export function portalRoutesFromPath(pathname = "") {
  if (pathname.startsWith("/project-manager")) return ROUTES.PROJECT_MANAGER;
  if (pathname.startsWith("/finance")) return ROUTES.FINANCE;
  return ROUTES.ADMIN;
}

/** Read-only BOQ document in the portal the current role can actually open. */
export function boqViewPath(role, boqId, projectId) {
  if (!boqId) return ROUTES.ADMIN.BOQ;
  const query = projectId != null && projectId !== "" ? `?projectId=${encodeURIComponent(projectId)}` : "";
  switch (role) {
    case ROLES.PROJECT_MANAGER:
      return `/project-manager/boq/${boqId}${query}`;
    case ROLES.BUSINESS_OWNER:
      return `/business-owner/boq/${boqId}${query}`;
    case ROLES.CLIENT:
      return `/client/boq/${boqId}${query}`;
    case ROLES.FINANCE:
      return `/finance/boq/${boqId}${query}`;
    default:
      return `/admin/boq/${boqId}${query}`;
  }
}

export function boqInboxPath(role) {
  switch (role) {
    case ROLES.PROJECT_MANAGER:
      return ROUTES.PROJECT_MANAGER.BOQ_INBOX;
    case ROLES.BUSINESS_OWNER:
      return ROUTES.BUSINESS_OWNER.BOQ_INBOX;
    case ROLES.CLIENT:
      return ROUTES.CLIENT.BOQ_APPROVALS;
    case ROLES.FINANCE:
      return ROUTES.FINANCE.BOQ_INBOX;
    default:
      return ROUTES.ADMIN.BOQ_INBOX;
  }
}

export const SCHEDULE_NAV_STATE = { from: "schedule" };
export const PROJECT_DETAIL_NAV_STATE = { from: "detail" };

export function projectRoutesForPath(pathname = "") {
  return pathname.startsWith("/project-manager") ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;
}

export function projectSchedulePath(pathname, projectId) {
  return projectRoutesForPath(pathname).PROJECT_SCHEDULE.replace(":projectId", projectId);
}

export function projectDetailPath(pathname, projectId) {
  return projectRoutesForPath(pathname).PROJECT_DETAIL.replace(":projectId", projectId);
}

/** Back target for pages opened from the schedule workspace (materials, resources, validation, etc.). */
export function projectPlanningBackPath(location, projectId) {
  if (!projectId) {
    return projectRoutesForPath(location?.pathname || "").DASHBOARD;
  }
  if (location?.state?.from === "detail") {
    return projectDetailPath(location.pathname, projectId);
  }
  return projectSchedulePath(location.pathname, projectId);
}
