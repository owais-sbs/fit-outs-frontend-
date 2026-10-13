import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Loader2, MapPin, Package, User, FileText, CheckCircle,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  acceptScPackage, fetchMyScProject, fetchMyScPackages,
} from "@/modules/admin/api/subcontractor.api";
import { ROUTES } from "@/shared/constants/routes";
import { SC_STATUS_BADGE, formatScStatus } from "../utils/subcontractor.utils";
import ProjectChatSection from "@/modules/admin/pages/communications/ProjectChatSection";

export default function SubcontractorProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingUuid, setAcceptingUuid] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

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

  const pendingAcceptance = project?.pendingAcceptanceCount ?? packages.filter((p) => p.status === "APPOINTED").length;

  const handleAccept = async (pkg) => {
    setAcceptingUuid(pkg.uuid);
    setActionMessage("");
    try {
      await acceptScPackage(pkg.uuid);
      setActionMessage("Package accepted. You can now submit claims and log progress.");
      load();
    } catch (e) {
      setActionMessage(e?.response?.data?.error || e?.response?.data?.message || "Could not accept package");
    } finally {
      setAcceptingUuid(null);
    }
  };

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

  const workStatus = project.status || "Assigned";
  const workProgress = Math.max(0, Math.min(100, Number(project.progress ?? 0)));

  return (
    <PageShell>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PROJECTS)}>
          <ArrowLeft className="h-4 w-4" /> Projects
        </Button>
      </div>

      <PageTitle
        title={project.projectName}
        subtitle={project.location || undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {project.location && (
              <Button asChild size="sm" variant="outline">
                <Link to={ROUTES.SUBCONTRACTOR.LOCATIONS}>View on map list</Link>
              </Button>
            )}
            <Button asChild size="sm" disabled={pendingAcceptance > 0}>
              <Link to={ROUTES.SUBCONTRACTOR.CLAIMS}>Submit claim</Link>
            </Button>
          </div>
        }
      />

      {actionMessage && (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary ring-1 ring-primary/20">
          {actionMessage}
        </p>
      )}

      {pendingAcceptance > 0 && (
        <Surface className="border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            {pendingAcceptance} package{pendingAcceptance !== 1 ? "s" : ""} awaiting your acceptance before work can begin.
          </p>
        </Surface>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Your work status"
          value={workStatus}
          icon={Briefcase}
        />
        <StatTile
          label="Approved progress"
          value={`${workProgress}%`}
          icon={CheckCircle}
        />
        <StatTile
          label="Your packages"
          value={project.packageCount ?? packages.length}
          icon={Package}
        />
        <StatTile
          label="Remaining qty (all)"
          value={totalRemaining}
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <MapPin className="h-4 w-4" /> Site location
          </h2>
          <div className="rounded-sm bg-muted/40 p-4">
            {project.location ? (
              <p className="text-sm font-medium">{project.location}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No site address recorded for this project yet.</p>
            )}
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
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Appointed packages</h2>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages on this project.</p>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.uuid}
                  className="rounded-sm border border-border/50 bg-card px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pkg.boqLineDescription || pkg.boqSectionCode || "—"}
                        {pkg.boqRoomLabel ? ` · ${pkg.boqRoomLabel}` : ""}
                        {pkg.boqFloorLabel ? ` · ${pkg.boqFloorLabel}` : ""}
                      </p>
                    </div>
                    <Badge className={`${SC_STATUS_BADGE[pkg.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                      {formatScStatus(pkg.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 rounded-sm bg-muted/40 px-3 py-2 text-[11px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Planned</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">{pkg.boqPlannedQty ?? 0}</p>
                    </div>
                    <div className="h-7 w-px bg-border/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Approved</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">{pkg.approvedClaimedQty ?? 0}</p>
                    </div>
                    <div className="h-7 w-px bg-border/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Left</p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">{pkg.remainingQty ?? 0}</p>
                    </div>
                  </div>
                  {pkg.status === "APPOINTED" && (
                    <Button
                      size="sm"
                      className="mt-3 w-full border-0 bg-[#0a1628] text-[#FAF7F2] hover:bg-[#0d1c32] hover:text-[#FAF7F2]"
                      disabled={acceptingUuid === pkg.uuid}
                      onClick={() => handleAccept(pkg)}
                    >
                      {acceptingUuid === pkg.uuid ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Accept assignment"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Surface>
      </div>

      <div className="w-full min-w-0">
        <ProjectChatSection projectId={projectId} className="min-h-[560px] w-full" />
      </div>
    </PageShell>
  );
}
