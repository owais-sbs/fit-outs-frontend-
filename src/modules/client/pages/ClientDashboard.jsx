import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Palette,
  Clock,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  FolderOpen,
  FileText,
} from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchClientDesignTasks, filterDesignsByStatus } from "@/modules/client/lib/clientDesignTasks";
import DesignCard from "@/modules/client/components/design/DesignCard";
import { cn } from "@/lib/utils";

const STAT_CARDS = [
  { label: "My Projects", key: "projects", icon: Briefcase, href: ROUTES.CLIENT.PROJECTS_MY },
  { label: "My Designs", key: "designs", icon: Palette, href: ROUTES.CLIENT.DESIGNS },
  { label: "Pending Approval", key: "pending", icon: Clock, href: ROUTES.CLIENT.DESIGNS_PENDING },
  { label: "Approved", key: "approved", icon: CheckCircle2, href: ROUTES.CLIENT.DESIGNS_APPROVED },
];

const btnPrimary =
  "gap-1.5 border-0 bg-[#0a1628] text-[#FAF7F2] hover:bg-[#081729] hover:text-[#FAF7F2]";
const btnOutline =
  "gap-1.5 border-[#0a1628]/15 bg-card text-foreground hover:bg-[#C9A96E]/15 hover:text-[#8a6d3b] hover:border-[#C9A96E]/35";
const btnGhost =
  "gap-1.5 text-muted-foreground hover:bg-[#C9A96E]/12 hover:text-[#8a6d3b]";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAllProjects().catch(() => []),
      fetchClientDesignTasks().catch(() => []),
    ])
      .then(([projectList, designList]) => {
        setProjects(Array.isArray(projectList) ? projectList : []);
        setDesigns(Array.isArray(designList) ? designList : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    projects: projects.length,
    designs: designs.length,
    pending: filterDesignsByStatus(designs, "pending").length,
    approved: filterDesignsByStatus(designs, "approved").length,
  };

  const recentDesigns = designs.slice(0, 3);

  return (
    <PageShell className="space-y-8">
      <DashboardHeader
        title="Client"
        description="Track your fit-out projects — review designs, documents, and progress from one place."
      >
        <Button asChild size="sm" className={btnPrimary}>
          <Link to={ROUTES.CLIENT.PROJECTS_MY}>
            <Briefcase className="h-3.5 w-3.5" />
            My Projects
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={btnOutline}>
          <Link to={ROUTES.CLIENT.BOQ_APPROVALS}>
            <FileText className="h-3.5 w-3.5" />
            BOQ Approvals
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={btnOutline}>
          <Link to={ROUTES.CLIENT.PROJECTS_REQUEST}>Request a project</Link>
        </Button>
      </DashboardHeader>

      {loading ? <LoadingPanel size="page" messages={loadingMessages.dashboard} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => navigate(s.href)}
              className="text-left transition-opacity hover:opacity-90"
            >
              <StatTile
                label={s.label}
                value={loading ? "…" : stats[s.key]}
                icon={Icon}
              />
            </button>
          );
        })}
      </div>

      {loading ? null : recentDesigns.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 px-6 pb-10 pt-14 text-center">
            <span className="relative mt-2 flex h-14 w-14 items-center justify-center rounded-xl border border-[#C9A96E]/35 bg-[#C9A96E]/20 text-[#8a6d3b] shadow-sm">
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-[#0a1628]/5" aria-hidden />
              <FolderOpen className="relative h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Design workspace</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                No design options have been shared yet. When your project team submits designs for review, they will appear here.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button size="sm" className={btnPrimary} onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)}>
                View my projects
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={btnOutline}
                onClick={() => navigate(ROUTES.CLIENT.PROJECTS_REQUEST)}
              >
                Request a project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent designs</h2>
              <p className="text-sm text-muted-foreground">Shared with you for review</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={btnGhost}
              onClick={() => navigate(ROUTES.CLIENT.DESIGNS)}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentDesigns.map((design) => (
              <DesignCard key={design.id} design={design} detailRoute={design.detailRoute} />
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 ? (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">Recent projects</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">Your active fit-out engagements</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={btnGhost}
              onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    navigate(ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", project.id))
                  }
                  className={cn(
                    "rounded-sm border border-border/70 bg-card p-4 text-left transition-colors",
                    "hover:border-[#C9A96E]/40 hover:bg-[#C9A96E]/10"
                  )}
                >
                  <p className="font-medium text-foreground">{project.projectName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{project.location || "—"}</span>
                    {project.status ? (
                      <Badge
                        variant="outline"
                        className="rounded-sm border-[#0a1628]/15 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        {project.status}
                      </Badge>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
