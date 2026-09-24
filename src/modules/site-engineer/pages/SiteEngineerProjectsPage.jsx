import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, MapPin, Loader2, MessageSquare } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import { ROUTES } from "@/shared/constants/routes";

const STATUS_BADGE = {
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  Completed: "bg-emerald-500/15 text-emerald-700 border-none",
  Planning: "bg-amber-500/15 text-amber-700 border-none",
  "On Hold": "bg-orange-500/15 text-orange-700 border-none",
  Cancelled: "bg-destructive/15 text-destructive border-none",
  Active: "bg-blue-500/15 text-blue-700 border-none",
};

export default function SiteEngineerProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMySiteEngineerProjects()
      .then((projs) => {
        if (!cancelled) setProjects(Array.isArray(projs) ? projs : []);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openProject = (projectId, tab) => {
    const base = ROUTES.SITE_ENGINEER.PROJECT_DETAIL.replace(":projectId", projectId);
    navigate(tab === "communications" ? `${base}?tab=communications` : base);
  };

  return (
    <PageShell>
      <PageTitle
        title="My Projects"
        subtitle="Open a project for overview or client communications"
        actions={
          <Button onClick={() => navigate(ROUTES.SITE_ENGINEER.SITE_VISITS)}>Site Visits</Button>
        }
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && projects.length === 0 ? (
        <Surface className="px-4 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
        </Surface>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Surface key={p.id} className="p-5 space-y-3">
              <button
                type="button"
                className="w-full space-y-2 text-left"
                onClick={() => openProject(p.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{p.name || p.projectName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.clientName || "—"}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[p.status] || "bg-muted border-none"} shrink-0 text-[10px]`}>
                    {p.status || "Active"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.location || "—"}
                </div>
              </button>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => openProject(p.id)}>
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openProject(p.id, "communications")}
                >
                  <MessageSquare className="mr-1 h-3.5 w-3.5" />
                  Communications
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </PageShell>
  );
}
