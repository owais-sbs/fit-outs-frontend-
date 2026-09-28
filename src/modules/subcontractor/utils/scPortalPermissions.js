import { SC_ROLES } from "./scPortalRoles";

/** All toggleable SC portal permissions (excludes main-contractor tender evaluation). */
export const SC_PERMISSION_CATALOG = [
  { key: "VIEW_RFQS", label: "View RFQs", group: "tendering" },
  { key: "VIEW_TENDER_BOQ", label: "View tender BOQ", group: "tendering" },
  { key: "DRAFT_QUOTE", label: "Draft quote", group: "tendering" },
  { key: "SUBMIT_QUOTE", label: "Submit quote", group: "tendering" },
  { key: "CLARIFICATIONS", label: "Raise clarifications", group: "tendering" },
  { key: "VIEW_ADDENDA", label: "View addenda", group: "tendering" },
  { key: "MY_BIDS", label: "My bids", group: "tendering" },
  { key: "VIEW_AWARDED_PACKAGE", label: "View awarded package", group: "execution" },
  { key: "PROGRESS_ENTRY", label: "Enter progress", group: "execution" },
  { key: "MANPOWER", label: "Enter manpower", group: "execution" },
  { key: "MATERIAL_REQUESTS", label: "Material requests", group: "execution" },
  { key: "SNAGS", label: "Snags", group: "execution" },
  { key: "INSPECTIONS", label: "Inspection request", group: "execution" },
  { key: "HSE", label: "HSE", group: "execution" },
  { key: "VIEW_COMMERCIAL_BOQ", label: "View awarded commercial BOQ", group: "commercial" },
  { key: "CLAIMS", label: "Submit claim", group: "commercial" },
  { key: "CERTIFICATES", label: "View certificates", group: "commercial" },
  { key: "RETENTION", label: "Retention", group: "commercial" },
  { key: "BACK_CHARGES", label: "Back charges", group: "commercial" },
  { key: "PAYMENT_STATUS", label: "Payment status", group: "commercial" },
  { key: "METHOD_STATEMENTS", label: "Method statements", group: "documents" },
  { key: "SHOP_DRAWINGS", label: "Shop drawings", group: "documents" },
  { key: "MATERIAL_SUBMITTALS", label: "Material submittals", group: "documents" },
  { key: "REVISIONS", label: "Revisions", group: "documents" },
  { key: "AS_BUILTS", label: "As-builts", group: "documents" },
  { key: "OM_DOCS", label: "O&M / warranty docs", group: "documents" },
];

const ROLE_DEFAULTS = {
  [SC_ROLES.ESTIMATOR]: [
    "VIEW_RFQS", "VIEW_TENDER_BOQ", "DRAFT_QUOTE", "SUBMIT_QUOTE",
    "CLARIFICATIONS", "VIEW_ADDENDA", "MY_BIDS",
  ],
  [SC_ROLES.SUPERVISOR]: [
    "VIEW_AWARDED_PACKAGE", "PROGRESS_ENTRY", "MANPOWER", "MATERIAL_REQUESTS",
    "SNAGS", "INSPECTIONS", "HSE",
  ],
  [SC_ROLES.QS]: [
    "VIEW_COMMERCIAL_BOQ", "CLAIMS", "CERTIFICATES", "RETENTION",
    "BACK_CHARGES", "PAYMENT_STATUS",
  ],
  [SC_ROLES.DOC_CONTROLLER]: [
    "METHOD_STATEMENTS", "SHOP_DRAWINGS", "MATERIAL_SUBMITTALS",
    "REVISIONS", "AS_BUILTS", "OM_DOCS",
  ],
};

export function defaultPermissionsForRole(role) {
  return [...(ROLE_DEFAULTS[role] || [])];
}

export function togglePermission(selected, key, next) {
  const set = new Set(selected);
  if (next) set.add(key);
  else set.delete(key);
  return [...set];
}
