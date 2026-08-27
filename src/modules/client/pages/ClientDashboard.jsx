import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, Clock, CheckCircle2, ArrowRight, Briefcase, FolderOpen, Loader2 } from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { fetchClientDesignTasks, filterDesignsByStatus } from "@/modules/client/lib/clientDesignTasks";
import DesignCard from "@/modules/client/components/design/DesignCard";

const STAT_CARDS = [
  { label: "My Projects", key: "projects", icon: Briefcase, href: ROUTES.CLIENT.PROJECTS_MY },
  { label: "My Designs", key: "designs", icon: Palette, href: ROUTES.CLIENT.DESIGNS },
  { label: "Pending Approval", key: "pending", icon: Clock, href: ROUTES.CLIENT.DESIGNS_PENDING },
  { label: "Approved", key: "approved", icon: CheckCircle2, href: ROUTES.CLIENT.DESIGNS_APPROVED },
];

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
      <PageTitle
        title="Welcome back"
        subtitle="Track your fit-out projects — review designs, documents, and project progress from one place."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => navigate(s.href)}
            className="text-left"
          >
            <StatTile label={s.label} value={loading ? "…" : stats[s.key]} icon={s.icon} />
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recentDesigns.length === 0 ? (
        <Surface className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Design workspace</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                No design options have been shared yet. When your project team submits designs for review, they will appear here.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button size="sm" onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)}>
                View my projects
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.CLIENT.PROJECTS_REQUEST)}>
                Request a project
              </Button>
            </div>
          </div>
        </Surface>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">Recent designs</h2>
              <p className="text-sm text-muted-foreground">Shared with you for review</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(ROUTES.CLIENT.DESIGNS)}>
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

      {projects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">Recent Projects</h2>
              <p className="text-sm text-muted-foreground">Your active fit-out engagements</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", project.id))}
                className="rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:bg-muted/30"
              >
                <p className="font-medium">{project.projectName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{project.location || "—"} · {project.status}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
