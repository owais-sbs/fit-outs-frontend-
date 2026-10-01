import { useLocation, useParams, matchPath } from "react-router-dom";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { PageBackLink } from "@/components/layout/PageShell";
import { useProjectName } from "@/modules/admin/hooks/useProjectName";
import { portalRoutesFromPath } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const SECTION_LABELS = {
  schedule: "Schedule",
  planning: "Planning",
  material: "Material",
  resource: "Resource",
  labour: "Labour",
  subcontractors: "Subcontractor",
  audit: "Audit",
  "material-plan": "Material plan",
  "resource-plan": "Resource plan",
  "labour-plan": "Labour plan",
  validation: "Validation",
  snags: "Snags",
  variations: "Variations",
  documents: "Documents",
  reporting: "Reporting",
  billing: "Billing",
  completion: "Completion",
  approvals: "Approvals",
  drawings: "Drawings",
  qto: "Quantity take-off",
  "room-tasks": "Room task",
  rooms: "Room chat",
  pnl: "P&L",
};

/**
 * Derive a human label for the page under /projects/:projectId/...
 */
function sectionLabelFromPath(pathname, projectId) {
  if (!pathname || !projectId) return "";
  const marker = `/projects/${projectId}/`;
  const idx = pathname.indexOf(marker);
  if (idx < 0) return "";

  const rest = pathname.slice(idx + marker.length).split("/").filter(Boolean);
  if (rest.length === 0) return "";

  for (let i = rest.length - 1; i >= 0; i -= 1) {
    const key = rest[i].toLowerCase();
    if (SECTION_LABELS[key]) return SECTION_LABELS[key];
  }

  const parent = rest[0]?.toLowerCase();
  if (SECTION_LABELS[parent]) return SECTION_LABELS[parent];

  return rest[rest.length - 1]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Path line with back control on the same row:
 * `←  Projects > {projectName} > {section}`
 */
export default function ProjectPathLine({
  projectId: projectIdProp,
  initialName = "",
  current,
  className,
  /** Prefer explicit back target; otherwise detail ← projects list, nested ← project detail */
  backTo,
  backState,
  backOnClick,
  backTitle,
  showBack = true,
}) {
  const { projectId: paramId } = useParams();
  const location = useLocation();
  const projectId = projectIdProp ?? paramId;
  const { name } = useProjectName(projectId, initialName);

  const routes = portalRoutesFromPath(location.pathname);
  const projectsListPath = routes.PROJECTS || "/admin/projects";
  const detailPath =
    projectId && routes.PROJECT_DETAIL
      ? routes.PROJECT_DETAIL.replace(":projectId", projectId)
      : null;

  const onDetailPage =
    !!detailPath &&
    !!matchPath({ path: detailPath, end: true }, location.pathname);

  const section =
    (current && String(current).trim()) ||
    (!onDetailPage ? sectionLabelFromPath(location.pathname, projectId) : "");

  if (!projectId) return null;

  const items = [{ label: "Projects", to: projectsListPath }];

  if (section && detailPath) {
    items.push({ label: name, to: detailPath });
    items.push({ label: section });
  } else {
    items.push({ label: name });
  }

  const resolvedBackTo =
    backTo ??
    (typeof backOnClick === "function"
      ? undefined
      : onDetailPage
        ? projectsListPath
        : detailPath);
  const resolvedBackTitle =
    backTitle || (onDetailPage ? "Back to projects" : "Back to project");
  const hasBack =
    showBack && (resolvedBackTo != null || typeof backOnClick === "function");

  return (
    <div className={cn("mb-1 flex items-center gap-1.5", className)}>
      {hasBack ? (
        <PageBackLink
          to={resolvedBackTo}
          state={backState}
          onClick={backOnClick}
          title={resolvedBackTitle}
          className="-ml-1.5 h-8 w-8"
        />
      ) : null}
      <Breadcrumbs className="min-w-0" items={items} />
    </div>
  );
}
