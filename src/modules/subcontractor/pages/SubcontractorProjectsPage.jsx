import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Loader2, MapPin, Package, User } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchMyScPackages, fetchMyScProjects } from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-2.5 last:border-0">
      <span className="flex w-32 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function SubcontractorProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchMyScProjects().catch(() => []),
      fetchMyScPackages().catch(() => []),
    ])
      .then(([projectList, packageList]) => {
        const projArr = Array.isArray(projectList) ? projectList : [];
        const pkgArr = Array.isArray(packageList) ? packageList : [];
        setProjects(projArr);
        setPackages(pkgArr);
        setSelectedId((prev) => prev || projArr[0]?.projectId || null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => projects.find((p) => String(p.projectId) === String(selectedId)),
    [projects, selectedId]
  );

  const selectedPackages = useMemo(
    () => packages.filter((p) => String(p.projectId) === String(selectedId)),
    [packages, selectedId]
  );

  return (
    <PageShell>
      <PageTitle
        title="My Projects"
        subtitle="Projects you are appointed on, with site location and package breakdown."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.SUBCONTRACTOR.LOCATIONS}>Site locations</Link>
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <div className="space-y-3">
            {projects.length === 0 ? (
              <Surface className="px-4 py-16 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
              </Surface>
            ) : (
              projects.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => setSelectedId(project.projectId)}
                  className={`w-full space-y-3 rounded-2xl p-4 text-left transition-all ${
                    String(selectedId) === String(project.projectId)
                      ? "bg-primary/5 ring-1 ring-primary/25"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {project.projectName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {project.packageCount} package{project.packageCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge className={`${SC_STATUS_BADGE[project.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                      {project.status || "Active"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{project.location || "Location not set"}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <Surface className="p-5">
            {!selected ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Select a project to view details.</p>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      {selected.projectName}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {selected.location || "Location not set"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(
                      ROUTES.SUBCONTRACTOR.PROJECT_DETAIL.replace(":projectId", selected.projectId)
                    )}
                  >
                    Full view
                  </Button>
                </div>

                <div className="rounded-xl bg-secondary/40 px-4">
                  <InfoRow label="Status" value={selected.status} />
                  <InfoRow label="Type" value={selected.projectType} />
                  <InfoRow label="Project manager" value={selected.assignedManager} icon={User} />
                  <InfoRow label="Active packages" value={String(selected.activePackageCount ?? 0)} icon={Package} />
                </div>

                <Separator />

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Your packages on this project</h3>
                  {selectedPackages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No packages on this project.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPackages.map((pkg) => (
                        <div
                          key={pkg.uuid}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pkg.boqSectionCode || "No section code"}
                              {pkg.remainingQty != null ? ` · ${pkg.remainingQty} remaining` : ""}
                            </p>
                          </div>
                          <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                            {formatScStatus(pkg.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Surface>
        </div>
      )}
    </PageShell>
  );
}
