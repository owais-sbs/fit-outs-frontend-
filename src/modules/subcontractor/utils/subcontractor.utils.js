import {
  LayoutDashboard, Briefcase, Package, FileText, MapPin, ClipboardList, FolderOpen,
  ListTodo, GitBranch, AlertTriangle, CreditCard, Table2, Building2, Users, UserCog,
  Layers, Inbox, MessageCircle, Stamp, FileCheck, Truck, Shield, HardHat, Search,
  Receipt, Scale, Award, Bell, FileStack, PenLine, Ruler,
} from "lucide-react";

import { ROUTES } from "@/shared/constants/routes";
import { ALL_SC_ROLES, SC_ROLES } from "./scPortalRoles";

export const SC_STATUS_BADGE = {
  OPEN: "bg-slate-500/15 text-slate-700 border-none",
  APPOINTED: "bg-amber-500/15 text-amber-700 border-none",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 border-none",
  COMPLETE: "bg-emerald-500/15 text-emerald-700 border-none",
  DRAFT: "bg-amber-500/15 text-amber-700 border-none",
  SUBMITTED: "bg-violet-500/15 text-violet-700 border-none",
  APPROVED: "bg-emerald-500/15 text-emerald-700 border-none",
  REJECTED: "bg-destructive/15 text-destructive border-none",
  MEASURED: "bg-sky-500/15 text-sky-700 border-none",
  CERTIFIED: "bg-indigo-500/15 text-indigo-700 border-none",
  PAID: "bg-emerald-500/15 text-emerald-700 border-none",
  AWARDED: "bg-emerald-500/15 text-emerald-700 border-none",
  ACKNOWLEDGED: "bg-emerald-500/15 text-emerald-700 border-none",
  DISPUTED: "bg-destructive/15 text-destructive border-none",
  PENDING: "bg-amber-500/15 text-amber-700 border-none",
  Assigned: "bg-slate-500/15 text-slate-700 border-none",
  "Pending acceptance": "bg-amber-500/15 text-amber-700 border-none",
  "In progress": "bg-blue-500/15 text-blue-700 border-none",
  Complete: "bg-emerald-500/15 text-emerald-700 border-none",
  Planning: "bg-amber-500/15 text-amber-700 border-none",
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  Completed: "bg-emerald-500/15 text-emerald-700 border-none",
};

export function formatScStatus(status) {
  if (!status) return "—";
  return String(status).replace(/_/g, " ");
}

export function deriveWorkStatusFromPackages(packages = []) {
  if (!packages.length) return "";
  const statuses = packages.map((p) => String(p.status || "").toUpperCase());
  if (statuses.every((s) => s === "COMPLETE")) return "Complete";
  const anyAppointed = statuses.some((s) => s === "APPOINTED");
  const anyInProgress = statuses.some((s) => s === "IN_PROGRESS");
  if (anyAppointed && !anyInProgress) return "Pending acceptance";
  if (anyAppointed || anyInProgress) return "In progress";
  return "Assigned";
}

export function computePackageWorkProgress(packages = []) {
  let planned = 0;
  let approved = 0;
  for (const pkg of packages) {
    planned += Number(pkg.boqPlannedQty ?? 0);
    approved += Number(pkg.approvedClaimedQty ?? 0);
  }
  if (planned <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((approved / planned) * 100)));
}

export function groupPackagesByProject(packages = []) {
  const map = new Map();
  packages.forEach((pkg) => {
    const key = String(pkg.projectId);
    if (!map.has(key)) {
      map.set(key, {
        projectId: pkg.projectId,
        projectName: pkg.projectName || `Project #${pkg.projectId}`,
        location: pkg.projectLocation || "",
        projectType: pkg.projectType || "",
        assignedManager: pkg.assignedManager || "",
        packages: [],
      });
    }
    map.get(key).packages.push(pkg);
  });
  return Array.from(map.values()).map((entry) => ({
    ...entry,
    status: deriveWorkStatusFromPackages(entry.packages),
    progress: computePackageWorkProgress(entry.packages),
    packageCount: entry.packages.length,
    pendingAcceptanceCount: entry.packages.filter((p) => p.status === "APPOINTED").length,
  }));
}

/**
 * Role-scoped navigation per Part C subcontractor portal spec.
 * SC Admin bypasses filtering and sees every item.
 */
export const SC_NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.SUBCONTRACTOR.DASHBOARD, icon: LayoutDashboard, roles: ALL_SC_ROLES },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Company profile", href: ROUTES.SUBCONTRACTOR.COMPANY_PROFILE, icon: Building2, roles: [SC_ROLES.ADMIN] },
      { label: "Extended profile & bank", href: ROUTES.SUBCONTRACTOR.ORG_EXTRAS, icon: Layers, roles: [SC_ROLES.ADMIN] },
      { label: "Worker roster", href: ROUTES.SUBCONTRACTOR.WORKERS, icon: Users, roles: [SC_ROLES.ADMIN] },
      { label: "Portal team", href: ROUTES.SUBCONTRACTOR.TEAM, icon: UserCog, roles: [SC_ROLES.ADMIN] },
      { label: "Notifications", href: ROUTES.SUBCONTRACTOR.NOTIFICATIONS, icon: Bell, roles: [SC_ROLES.ADMIN] },
    ],
  },
  {
    label: "Oversight",
    items: [
      { label: "Packages (all projects)", href: ROUTES.SUBCONTRACTOR.PACKAGES, icon: Package, roles: [SC_ROLES.ADMIN] },
      { label: "Projects", href: ROUTES.SUBCONTRACTOR.PROJECTS, icon: Briefcase, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Site locations", href: ROUTES.SUBCONTRACTOR.LOCATIONS, icon: MapPin, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Awards & contracts", href: ROUTES.SUBCONTRACTOR.AWARDS, icon: Stamp, roles: [SC_ROLES.ADMIN] },
      { label: "Back-charges", href: ROUTES.SUBCONTRACTOR.BACK_CHARGES, icon: Scale, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
      { label: "Variations", href: ROUTES.SUBCONTRACTOR.VARIATIONS, icon: GitBranch, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
      { label: "Performance scorecard", href: ROUTES.SUBCONTRACTOR.SCORECARD, icon: Award, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
    ],
  },
  {
    label: "Bidding",
    items: [
      { label: "RFQ inbox", href: ROUTES.SUBCONTRACTOR.RFQ, icon: Inbox, roles: [SC_ROLES.ADMIN, SC_ROLES.ESTIMATOR] },
      { label: "Quote / rate entry", href: ROUTES.SUBCONTRACTOR.BOQ, icon: Table2, roles: [SC_ROLES.ADMIN, SC_ROLES.ESTIMATOR] },
      { label: "Clarifications", href: ROUTES.SUBCONTRACTOR.CLARIFICATIONS, icon: MessageCircle, roles: [SC_ROLES.ADMIN, SC_ROLES.ESTIMATOR] },
      { label: "My bids", href: ROUTES.SUBCONTRACTOR.MY_BIDS, icon: FileCheck, roles: [SC_ROLES.ADMIN, SC_ROLES.ESTIMATOR] },
      { label: "Award packs", href: ROUTES.SUBCONTRACTOR.AWARD_PACKS, icon: FileStack, roles: [SC_ROLES.ADMIN, SC_ROLES.ESTIMATOR] },
    ],
  },
  {
    label: "Site execution",
    items: [
      { label: "My activities", href: ROUTES.SUBCONTRACTOR.TASKS, icon: ListTodo, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Progress updates", href: ROUTES.SUBCONTRACTOR.PROGRESS_LOGS, icon: ClipboardList, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Material requests", href: ROUTES.SUBCONTRACTOR.MATERIAL_REQUESTS, icon: Truck, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Snags", href: ROUTES.SUBCONTRACTOR.SNAGS, icon: AlertTriangle, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Inspection requests", href: ROUTES.SUBCONTRACTOR.INSPECTIONS, icon: Search, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "HSE", href: ROUTES.SUBCONTRACTOR.HSE, icon: HardHat, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
      { label: "Drawings", href: ROUTES.SUBCONTRACTOR.DOCUMENTS, icon: FolderOpen, roles: [SC_ROLES.ADMIN, SC_ROLES.SUPERVISOR] },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "Progress claims", href: ROUTES.SUBCONTRACTOR.CLAIMS, icon: FileText, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
      { label: "Payment certificates", href: ROUTES.SUBCONTRACTOR.CERTIFICATES, icon: Receipt, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
      { label: "Retention ledger", href: ROUTES.SUBCONTRACTOR.RETENTION, icon: Scale, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
      { label: "Invoices", href: ROUTES.SUBCONTRACTOR.PAYMENTS, icon: CreditCard, roles: [SC_ROLES.ADMIN, SC_ROLES.QS] },
    ],
  },
  {
    label: "Technical documents",
    items: [
      { label: "Submittals", href: ROUTES.SUBCONTRACTOR.SUBMITTALS, icon: PenLine, roles: [SC_ROLES.ADMIN, SC_ROLES.DOC_CONTROLLER] },
      { label: "Consultant review", href: ROUTES.SUBCONTRACTOR.REVIEW_STATUS, icon: FileCheck, roles: [SC_ROLES.ADMIN, SC_ROLES.DOC_CONTROLLER] },
      { label: "As-builts", href: ROUTES.SUBCONTRACTOR.AS_BUILTS, icon: Ruler, roles: [SC_ROLES.ADMIN, SC_ROLES.DOC_CONTROLLER] },
      { label: "Drawing register", href: ROUTES.SUBCONTRACTOR.DRAWING_REGISTER, icon: FolderOpen, roles: [SC_ROLES.ADMIN, SC_ROLES.DOC_CONTROLLER] },
    ],
  },
];

export function filterScNavGroups(groups, portal = {}) {
  const role = portal.portalRole;
  if (!role) return [];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (role === SC_ROLES.ADMIN) return true;
        return item.roles?.includes(role);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
