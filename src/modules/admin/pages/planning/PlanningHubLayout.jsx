import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import {
  ClipboardList,
  HardHat,
  Package,
  Users,
  Wrench,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { cn } from "@/lib/utils";
import { fetchProjectById } from "../../api/projects.api";
import {
  projectPlanningBackPath,
  projectRoutesForPath,
} from "@/shared/constants/routes";
import { rememberProjectName } from "../../hooks/useProjectName";

const NAV = [
  { segment: "material", label: "Material", icon: Package },
  { segment: "resource", label: "Resource", icon: Wrench },
  { segment: "labour", label: "Labour", icon: Users },
  { segment: "subcontractors", label: "Subcontractor", icon: HardHat },
  { segment: "audit", label: "Audit", icon: ClipboardList },
];

/**
 * Project Planning Hub shell with horizontal segmented navigation.
 * Child pages receive outlet context { inPlanningHub: true, projectName }.
 */
export default function PlanningHubLayout() {
  const { projectId } = useParams();
  const location = useLocation();
  const routes = projectRoutesForPath(location.pathname);
  const [projectName, setProjectName] = useState("");

  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  useEffect(() => {
    let cancelled = false;
    fetchProjectById(projectId)
      .then((p) => {
        if (!cancelled) {
          const name = p?.projectName || p?.name || "";
          setProjectName(name);
          rememberProjectName(projectId, name);
        }
      })
      .catch(() => {
        if (!cancelled) setProjectName("");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const displayName = projectName || "Project";

  const basePath = useMemo(
    () => (routes.PROJECT_PLANNING || "").replace(":projectId", projectId),
    [routes.PROJECT_PLANNING, projectId]
  );

  return (
    <PageShell>
      <ProjectPageFrame>
        <ProjectPathLine
          projectId={projectId}
          initialName={projectName}
          backTo={backPath}
          backState={location.state}
          backTitle={`Back to ${backLabel}`}
        />
        <PageHeader
          title="Project Planning Hub"
        />

        <div className="space-y-6">
          <nav
            aria-label="Planning sections"
            className="flex overflow-x-auto no-scrollbar whitespace-nowrap rounded-sm border border-border bg-card p-1 shadow-sm"
          >
            {NAV.map(({ segment, label, icon: Icon }) => (
              <NavLink
                key={segment}
                to={`${basePath}/${segment}`}
                state={location.state}
                className={({ isActive }) =>
                  cn(
                    "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-bold text-accent-foreground shadow-none"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="min-w-0">
            <Outlet context={{ inPlanningHub: true, projectName: displayName }} />
          </div>
        </div>
      </ProjectPageFrame>
    </PageShell>
  );
}
