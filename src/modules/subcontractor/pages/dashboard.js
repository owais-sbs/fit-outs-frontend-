import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, FileText, Loader2, MapPin, Package, ArrowRight, ClipboardList,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/shared/constants/routes";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus, groupPackagesByProject } from "../utils/subcontractor.utils";

export default function SubcontractorDashboard() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchMyScPackages()
      .then((list) => setPackages(Array.isArray(list) ? list : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projects = useMemo(() => groupPackagesByProject(packages), [packages]);
  const activePackages = packages.filter((p) => p.status !== "COMPLETE").length;
  const locations = useMemo(
    () => projects.filter((p) => p.location).length,
    [projects]
  );

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Dashboard"
        subtitle="Your appointed work packages, projects, and site locations at a glance."
        actions={
          <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.CLAIMS)}>
            New claim
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Projects" value={projects.length} icon={Briefcase} />
        <StatTile label="Packages" value={packages.length} icon={Package} hint={`${activePackages} active`} />
        <StatTile label="Site locations" value={locations} icon={MapPin} />
        <StatTile
          label="Open work"
          value={activePackages}
          icon={ClipboardList}
          hint="Packages in progress"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent projects</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
              <Link to={ROUTES.SUBCONTRACTOR.PROJECTS}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          {projects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No projects assigned yet</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => navigate(
                    ROUTES.SUBCONTRACTOR.PROJECT_DETAIL.replace(":projectId", project.projectId)
                  )}
                  className="flex w-full items-start justify-between gap-3 rounded-xl bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{project.projectName}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {project.location || "Location not set"}
                    </p>
                  </div>
                  <Badge className={`${SC_STATUS_BADGE[project.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                    {project.status || "Active"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Surface>

        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Quick actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/50 bg-card/60 shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Packages</p>
                  <p className="text-xs text-muted-foreground">View appointed BOQ packages</p>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to={ROUTES.SUBCONTRACTOR.PACKAGES}>Open packages</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/60 shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Claims</p>
                  <p className="text-xs text-muted-foreground">Draft and submit progress claims</p>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Open claims</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/60 shadow-none sm:col-span-2">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Site locations</p>
                    <p className="text-xs text-muted-foreground">
                      Browse project addresses for your appointed work
                    </p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link to={ROUTES.SUBCONTRACTOR.LOCATIONS}>View locations</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Surface>
      </div>

      {packages.length > 0 && (
        <Surface className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Latest packages</h2>
          <div className="divide-y divide-border/30">
            {packages.slice(0, 5).map((pkg) => (
              <div key={pkg.uuid} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.projectName || `Project #${pkg.projectId}`}
                    {pkg.boqSectionCode ? ` · ${pkg.boqSectionCode}` : ""}
                  </p>
                </div>
                <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                  {formatScStatus(pkg.status)}
                </Badge>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
