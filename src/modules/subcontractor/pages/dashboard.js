import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase, FileText, Loader2, MapPin, Package, ArrowRight, ClipboardList, Table2,
  Inbox, FolderOpen, PenLine, Receipt, Award,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/shared/constants/routes";
import { fetchMyScPackages } from "@/modules/admin/api/subcontractor.api";
import { SC_STATUS_BADGE, formatScStatus, groupPackagesByProject } from "../utils/subcontractor.utils";
import { useSubcontractorPortal } from "../context/SubcontractorPortalContext";
import { SC_ROLES, roleLabel } from "../utils/scPortalRoles";

function QuickCard({ icon: Icon, title, description, href, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-700",
    blue: "bg-blue-500/10 text-blue-700",
    amber: "bg-amber-500/10 text-amber-700",
    emerald: "bg-emerald-500/10 text-emerald-700",
  };
  return (
    <Card className="border-border/50 bg-card/60 shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link to={href}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function roleDashboardCopy(portalRole) {
  switch (portalRole) {
    case SC_ROLES.ESTIMATOR:
      return "Open RFQs, deadlines and bid status — no site execution or payment data.";
    case SC_ROLES.SUPERVISOR:
      return "Today's assigned activities, progress and site issues — no commercial or payment data.";
    case SC_ROLES.QS:
      return "Claims, certificates, retention and invoices — progress entry is handled by site supervisors.";
    case SC_ROLES.DOC_CONTROLLER:
      return "Submittals, consultant review and drawing register — technical documentation only.";
    case SC_ROLES.ADMIN:
      return "Company-wide overview of packages, team, compliance and pending actions.";
    default:
      return "Your appointed work packages and site locations at a glance.";
  }
}

function RoleQuickActions({ portal }) {
  const role = portal.portalRole;
  if (role === SC_ROLES.ESTIMATOR) {
    return (
      <>
        <QuickCard icon={Inbox} title="RFQ inbox" description="Open tenders and deadlines" href={ROUTES.SUBCONTRACTOR.RFQ} tone="amber" />
        <QuickCard icon={Table2} title="Quote entry" description="Rates into BOQ template" href={ROUTES.SUBCONTRACTOR.BOQ} tone="amber" />
      </>
    );
  }
  if (role === SC_ROLES.SUPERVISOR) {
    return (
      <>
        <QuickCard icon={ClipboardList} title="Progress updates" description="Daily manpower and % complete" href={ROUTES.SUBCONTRACTOR.PROGRESS_LOGS} tone="blue" />
        <QuickCard icon={FolderOpen} title="Drawings" description="Latest revision only" href={ROUTES.SUBCONTRACTOR.DOCUMENTS} tone="blue" />
      </>
    );
  }
  if (role === SC_ROLES.QS) {
    return (
      <>
        <QuickCard icon={FileText} title="Progress claims" description="Submit against measured quantities" href={ROUTES.SUBCONTRACTOR.CLAIMS} tone="violet" />
        <QuickCard icon={Receipt} title="Invoices" description="Draft and track payments" href={ROUTES.SUBCONTRACTOR.PAYMENTS} tone="violet" />
      </>
    );
  }
  if (role === SC_ROLES.DOC_CONTROLLER) {
    return (
      <>
        <QuickCard icon={PenLine} title="Submittals" description="Method statements and shop drawings" href={ROUTES.SUBCONTRACTOR.SUBMITTALS} tone="emerald" />
        <QuickCard icon={FolderOpen} title="Drawing register" description="Latest revision and history" href={ROUTES.SUBCONTRACTOR.DRAWING_REGISTER} tone="emerald" />
      </>
    );
  }
  return (
    <>
      <QuickCard icon={Package} title="Packages" description="All appointed work across projects" href={ROUTES.SUBCONTRACTOR.PACKAGES} />
      <QuickCard icon={Award} title="Scorecard" description="Company performance rating" href={ROUTES.SUBCONTRACTOR.SCORECARD} tone="emerald" />
    </>
  );
}

function PrimaryAction({ portal, navigate }) {
  const role = portal.portalRole;
  if (role === SC_ROLES.ESTIMATOR) {
    return <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.RFQ)}>View RFQs</Button>;
  }
  if (role === SC_ROLES.SUPERVISOR) {
    return <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.TASKS)}>My activities</Button>;
  }
  if (role === SC_ROLES.QS) {
    return <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.CLAIMS)}>New claim</Button>;
  }
  if (role === SC_ROLES.DOC_CONTROLLER) {
    return <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.SUBMITTALS)}>Submittals</Button>;
  }
  if (role === SC_ROLES.ADMIN) {
    return <Button size="sm" onClick={() => navigate(ROUTES.SUBCONTRACTOR.PACKAGES)}>All packages</Button>;
  }
  return null;
}

export default function SubcontractorDashboard() {
  const navigate = useNavigate();
  const portal = useSubcontractorPortal();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const showPackageStats = portal.portalRole === SC_ROLES.ADMIN
    || portal.portalRole === SC_ROLES.SUPERVISOR;

  const load = useCallback(() => {
    if (!showPackageStats) {
      setPackages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyScPackages()
      .then((list) => setPackages(Array.isArray(list) ? list : []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [showPackageStats]);

  useEffect(() => {
    load();
  }, [load]);

  const projects = useMemo(() => groupPackagesByProject(packages), [packages]);
  const activePackages = packages.filter((p) => p.status !== "COMPLETE").length;
  const locations = useMemo(() => projects.filter((p) => p.location).length, [projects]);

  if (loading && showPackageStats) {
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
        subtitle={`${roleLabel(portal.portalRole)} — ${roleDashboardCopy(portal.portalRole)}`}
        actions={<PrimaryAction portal={portal} navigate={navigate} />}
      />

      {showPackageStats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Projects" value={projects.length} icon={Briefcase} />
          <StatTile label="Packages" value={packages.length} icon={Package} hint={`${activePackages} active`} />
          <StatTile label="Site locations" value={locations} icon={MapPin} />
          <StatTile label="Open work" value={activePackages} icon={ClipboardList} hint="Packages in progress" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {showPackageStats ? (
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
                      {project.location ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {project.location}
                        </p>
                      ) : null}
                    </div>
                    <Badge className={`${SC_STATUS_BADGE[project.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                      {project.status || "Assigned"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Surface>
        ) : (
          <Surface className="p-5">
            <h2 className="mb-2 text-sm font-semibold">Your workspace</h2>
            <p className="text-sm text-muted-foreground">{roleDashboardCopy(portal.portalRole)}</p>
          </Surface>
        )}

        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Quick actions</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleQuickActions portal={portal} />
          </div>
        </Surface>
      </div>

      {showPackageStats && packages.length > 0 && (
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
