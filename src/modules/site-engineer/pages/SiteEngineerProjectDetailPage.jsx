import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";
import ProjectClientCommsPanel from "@/modules/site-engineer/components/ProjectClientCommsPanel";
import { ROUTES } from "@/shared/constants/routes";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-2 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function SiteEngineerProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") === "communications" ? "communications" : "overview";

  const [project, setProject] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      fetchMySiteEngineerProjects().catch(() => []),
      fetchMySiteVisits().catch(() => []),
    ])
      .then(([projs, mine]) => {
        if (cancelled) return;
        const list = Array.isArray(projs) ? projs : [];
        const found = list.find((p) => String(p.id) === String(projectId));
        if (!found) {
          setError("Project not found or you are not assigned to it.");
          setProject(null);
        } else {
          setProject(found);
        }
        setVisits(Array.isArray(mine) ? mine : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const title = useMemo(
    () => project?.name || project?.projectName || `Project #${projectId}`,
    [project, projectId]
  );

  const setTab = (value) => {
    if (value === "communications") {
      setSearchParams({ tab: "communications" });
    } else {
      setSearchParams({});
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading project…
        </div>
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell>
        <PageTitle title="Project" subtitle={error || "Not found"} />
        <Button variant="outline" asChild>
          <Link to={ROUTES.SITE_ENGINEER.PROJECTS}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to projects
          </Link>
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title={title}
        subtitle={project.clientName || project.location || "Assigned project"}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.SITE_ENGINEER.PROJECTS}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Projects
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Surface className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">Project details</h2>
              <Badge variant="secondary">{project.status || "Active"}</Badge>
            </div>
            <div className="rounded-xl bg-secondary/40 px-4">
              <InfoRow label="Client" value={project.clientName} />
              <InfoRow label="Location" value={project.location} />
              <InfoRow label="Type" value={project.projectType} />
              <InfoRow label="Status" value={project.status} />
            </div>
          </Surface>

          <Surface className="p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" /> Your assigned visits
            </p>
            {visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits assigned to you.</p>
            ) : (
              <div className="space-y-2">
                {visits.map((v) => (
                  <div
                    key={v.uuid}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">Visit {v.uuid?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.scheduledDate || "—"} · {v.scheduledTime || ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          ROUTES.SITE_ENGINEER.SITE_VISIT_REPORT.replace(":visitId", v.uuid)
                        )
                      }
                    >
                      Open report
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </TabsContent>

        <TabsContent value="communications" className="mt-4">
          <ProjectClientCommsPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
