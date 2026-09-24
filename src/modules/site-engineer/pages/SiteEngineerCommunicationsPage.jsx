import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Loader2, MessageSquare } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import { ROUTES } from "@/shared/constants/routes";

export default function SiteEngineerCommunicationsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMySiteEngineerProjects()
      .then((list) => {
        if (!cancelled) setProjects(Array.isArray(list) ? list : []);
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

  return (
    <PageShell>
      <PageTitle
        title="Client Communication"
        subtitle="Choose an assigned project to chat with that project's client"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && projects.length === 0 ? (
        <Surface className="px-4 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No assigned projects yet. Once you are on a project team, client chat appears here.
          </p>
        </Surface>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const href = `${ROUTES.SITE_ENGINEER.PROJECT_DETAIL.replace(":projectId", p.id)}?tab=communications`;
            return (
              <Surface key={p.id} className="p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold">{p.name || p.projectName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.clientName || "Client"}</p>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link to={href}>
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    Open communications
                  </Link>
                </Button>
              </Surface>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
