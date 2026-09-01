import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Loader2, MapPin, Package, User, FileText,
} from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchMyScProject, fetchMyScPackages,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";

export default function SubcontractorProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetchMyScProject(projectId),
      fetchMyScPackages().catch(() => []),
    ])
      .then(([proj, pkgList]) => {
        setProject(proj);
        const filtered = (Array.isArray(pkgList) ? pkgList : [])
          .filter((p) => String(p.projectId) === String(projectId));
        setPackages(filtered);
      })
      .catch((e) => {
        setProject(null);
        setPackages([]);
        setError(e?.response?.data?.error || e?.response?.data?.message || "Project not found");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalRemaining = useMemo(
    () => packages.reduce((sum, p) => sum + Number(p.remainingQty ?? 0), 0),
    [packages]
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

  if (error || !project) {
    return (
      <PageShell>
        <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PROJECTS)}>
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Button>
        <Surface className="px-4 py-16 text-center">
          <p className="text-sm text-destructive">{error || "Project not found"}</p>
        </Surface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PROJECTS)}>
          <ArrowLeft className="h-4 w-4" /> Projects
        </Button>
      </div>

      <PageTitle
        title={project.projectName}
        subtitle={project.location || "Location not set"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to={ROUTES.SUBCONTRACTOR.LOCATIONS}>View on map list</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Submit claim</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/60 shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={`${SC_STATUS_BADGE[project.status] || "bg-muted border-none"} mt-1`}>
                {project.status || "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/60 shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your packages</p>
              <p className="text-xl font-semibold">{project.packageCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/60 shadow-none">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining qty (all)</p>
              <p className="text-xl font-semibold tabular-nums">{totalRemaining}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4" /> Site location
          </h2>
          <div className="rounded-xl bg-secondary/40 p-4">
            <p className="text-sm font-medium">{project.location || "No address on file"}</p>
            {project.projectType && (
              <p className="mt-2 text-xs text-muted-foreground">Project type: {project.projectType}</p>
            )}
            {project.assignedManager && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                PM: {project.assignedManager}
              </p>
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <h2 className="mb-4 text-sm font-semibold">Appointed packages</h2>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages on this project.</p>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => (
                <div
                  key={pkg.uuid}
                  className="rounded-xl border border-border/40 bg-card/50 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pkg.boqSectionCode || "No section"}
                      </p>
                    </div>
                    <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                      {formatScStatus(pkg.status)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                      <p className="text-muted-foreground">Planned</p>
                      <p className="font-semibold tabular-nums">{pkg.boqPlannedQty ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                      <p className="text-muted-foreground">Approved</p>
                      <p className="font-semibold tabular-nums">{pkg.approvedClaimedQty ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold tabular-nums">{pkg.remainingQty ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </PageShell>
  );
}
