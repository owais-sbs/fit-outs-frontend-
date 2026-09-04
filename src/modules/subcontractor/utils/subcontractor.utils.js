import { LayoutDashboard, Briefcase, Package, FileText, MapPin, ClipboardList, FolderOpen } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export const SC_STATUS_BADGE = {
  OPEN: "bg-slate-500/15 text-slate-700 border-none",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 border-none",
  COMPLETE: "bg-emerald-500/15 text-emerald-700 border-none",
  DRAFT: "bg-amber-500/15 text-amber-700 border-none",
  SUBMITTED: "bg-violet-500/15 text-violet-700 border-none",
  APPROVED: "bg-emerald-500/15 text-emerald-700 border-none",
  REJECTED: "bg-destructive/15 text-destructive border-none",
  Planning: "bg-amber-500/15 text-amber-700 border-none",
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  Completed: "bg-emerald-500/15 text-emerald-700 border-none",
};

export function formatScStatus(status) {
  if (!status) return "—";
  return String(status).replace(/_/g, " ");
}

export function groupPackagesByProject(packages = []) {
  const map = new Map();
  packages.forEach((pkg) => {
    const key = String(pkg.projectId);
    if (!map.has(key)) {
      map.set(key, {
        projectId: pkg.projectId,
        projectName: pkg.projectName || `Project #${pkg.projectId}`,
        location: pkg.projectLocation || pkg.location || "",
        status: pkg.projectStatus || "",
        projectType: pkg.projectType || "",
        assignedManager: pkg.assignedManager || "",
        packages: [],
      });
    }
    map.get(key).packages.push(pkg);
  });
  return Array.from(map.values());
}

export const SC_NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: ROUTES.SUBCONTRACTOR.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "My Projects", href: ROUTES.SUBCONTRACTOR.PROJECTS, icon: Briefcase },
      { label: "Packages", href: ROUTES.SUBCONTRACTOR.PACKAGES, icon: Package },
      { label: "Progress logs", href: ROUTES.SUBCONTRACTOR.PROGRESS_LOGS, icon: ClipboardList },
      { label: "Claims", href: ROUTES.SUBCONTRACTOR.CLAIMS, icon: FileText },
      { label: "Documents", href: ROUTES.SUBCONTRACTOR.DOCUMENTS, icon: FolderOpen },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Locations", href: ROUTES.SUBCONTRACTOR.LOCATIONS, icon: MapPin },
    ],
  },
];
