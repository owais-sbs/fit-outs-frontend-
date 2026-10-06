import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, MessageSquare, GanttChart } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import { ROUTES } from "@/shared/constants/routes";
import { STALE_TIMES } from "@/shared/api/queryClient";

export default function SiteEngineerProjectsPage() {
  const navigate = useNavigate();

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ["siteEngineerProjects"],
    queryFn: async () => {
      const projs = await fetchMySiteEngineerProjects();
      return Array.isArray(projs) ? projs : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

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
        <LoadingPanel size="inline" messages={loadingMessages.projects} />
      )}

      {!loading && projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects assigned"
          description="No projects assigned yet."
        />
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
                  <StatusBadge status={p.status || "Active"} className="shrink-0" />
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
                  variant="outline"
                  onClick={() =>
                    navigate(ROUTES.SITE_ENGINEER.PROJECT_SCHEDULE.replace(":projectId", p.id))
                  }
                >
                  <GanttChart className="mr-1 h-3.5 w-3.5" />
                  Programme
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
