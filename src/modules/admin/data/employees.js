import { ROLES } from "@/shared/constants/roles";

export const FEATURE_OPTIONS = [
  "DASHBOARD",
  "LEADS",
  "SOURCES",
  "CLIENTS",
  "SITE_VISITS",
  "CALENDAR",
  "PROJECTS",
  "SCHEDULE",
  "SCHEDULE_TEMPLATES",
  "APPROVALS",
  "VALIDATION",
  "VARIATIONS",
  "CHECKLISTS",
  "COMMUNICATIONS",
  "VENDORS",
  "DESIGN",
  "QAS",
  "BOQ",
  "SUBCONTRACTOR_APPS",
  "PROCUREMENT",
  "PROJECT_CONFIG",
  "EMPLOYEES",
  "SETTINGS",
  "TERMS",
  "TASKS",
  "ACTIVITIES",
  "SNAGS",
  "ACCOUNTS",
  "COMPANIES",
  "SUBSCRIPTIONS",
  "REPORTS",
];

export const FINANCIAL_FEATURES = ["ACCOUNTS", "COMPANIES", "SUBSCRIPTIONS", "REPORTS"];

export const MATRIX_FEATURES = [
  // CRM
  "LEADS",
  "SOURCES",
  "CLIENTS",
  // BOQ
  "BOQ",
  // Project Tasks
  "PROJECTS",
  "TASKS",
  // Subcontractor Management
  "SUBCONTRACTOR_APPS",
  "VENDORS",
  // Resource Management
  "PROCUREMENT",
  "PROJECT_CONFIG",
  // Progress Reporting
  "ACTIVITIES",
  "VALIDATION",
  // Variation (CR)
  "VARIATIONS",
];

export const SITE_ENGINEER_FEATURES = [
  "DASHBOARD",
  "SITE_VISITS",
  "TASKS",
  "ACTIVITIES",
  "SNAGS",
  "PROJECTS",
  "COMMUNICATIONS",
  "TERMS",
];

export function defaultFeaturesForRole(role) {
  if (role === ROLES.SITE_ENGINEER) return [...SITE_ENGINEER_FEATURES];
  if (role === ROLES.BUSINESS_OWNER || role === ROLES.FINANCE) {
    return [...MATRIX_FEATURES, ...FINANCIAL_FEATURES];
  }
  // PM, QS, Designer, Sales
  return [...MATRIX_FEATURES];
}

export const INITIAL_EMPLOYEES = [
  {
    id: 1,
    employeeName: "James Wu",
    email: "james.wu@fitouts.com.au",
    phone: "+61 412 001 001",
    designation: "Sales Executive",
    features: ["LEADS", "SITE_VISITS"],
    isActive: true,
  },
  {
    id: 2,
    employeeName: "Emma Walsh",
    email: "emma.walsh@fitouts.com.au",
    phone: "+61 412 002 002",
    designation: "Interior Designer",
    features: ["LEADS", "PROJECTS"],
    isActive: true,
  },
  {
    id: 3,
    employeeName: "Tom Bradley",
    email: "tom.bradley@fitouts.com.au",
    phone: "+61 412 003 003",
    designation: "Site Engineer",
    features: ["SITE_VISITS", "PROJECTS", "CHECKLISTS"],
    isActive: true,
  },
  {
    id: 4,
    employeeName: "Lisa Park",
    email: "lisa.park@fitouts.com.au",
    phone: "+61 412 004 004",
    designation: "Project Manager",
    features: ["LEADS", "SITE_VISITS", "EMPLOYEES", "ACCOUNTS", "PROJECTS", "SETTINGS"],
    isActive: true,
  },
  {
    id: 5,
    employeeName: "David Chen",
    email: "david.chen@fitouts.com.au",
    phone: "+61 412 005 005",
    designation: "Accountant",
    features: ["REPORTS"],
    isActive: true,
  },
];

export function getEmployeeById(id) {
  return INITIAL_EMPLOYEES.find((e) => e.id === id) || null;
}

export function getAllEmployees() {
  return [...INITIAL_EMPLOYEES];
}
