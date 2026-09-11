import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GanttChart, Loader2 } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchPublishedProjectSchedule } from "@/modules/admin/api/schedule.api";
import { fetchProjectById } from "@/modules/admin/api/projects.api";
import CpmGantt from "@/modules/admin/pages/schedule/CpmGantt";
import { ROUTES } from "@/shared/constants/routes";

export default function ClientProjectSchedulePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [activities, setActivities] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [criticalPaths, setCriticalPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const detailPath = ROUTES.CLIENT.PROJECT_DETAIL.replace(":projectId", projectId);

  const load = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetchProjectById(projectId).catch(() => null),
      fetchPublishedProjectSchedule(projectId),
    ])
      .then(([project, schedule]) => {
        setProjectName(project?.name || project?.projectName || `Project ${projectId}`);
        const acts = Array.isArray(schedule?.activities) ? schedule.activities : [];
        // Prefer per-activity critical from CPM engine; fall back to primary path list.
        const pathCrit = new Set((schedule?.criticalPath || []).map(String));
        setActivities(
          acts.map((a) => ({
            ...a,
            critical: !!a.critical || pathCrit.has(String(a.uuid)),
          }))
        );
        setDependencies(Array.isArray(schedule?.dependencies) ? schedule.dependencies : []);
        const paths = Array.isArray(schedule?.criticalPaths) && schedule.criticalPaths.length
          ? schedule.criticalPaths
          : schedule?.criticalPath
            ? [schedule.criticalPath]
            : [];
        setCriticalPaths(paths);
      })
      .catch((e) => {
        setActivities([]);
        setDependencies([]);
        setCriticalPaths([]);
        setError(e?.response?.data?.error || e?.message || "Could not load programme");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell className="mx-auto max-w-[1400px]">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => navigate(detailPath)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link to={detailPath} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to project
        </Link>
      </div>

      <PageTitle
        title="Programme"
        subtitle={
          projectName
            ? `${projectName} — published schedule (read-only)`
            : "Published schedule (read-only)"
        }
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading programme…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <GanttChart className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">Programme not published yet</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Your project team will publish the programme when it is ready. You will see the Gantt chart
            here after publish.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to={detailPath}>Back to project</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Critical path highlighted · {activities.length} activities
          </p>
          <CpmGantt
            activities={activities}
            dependencies={dependencies}
            emptyMessage="Programme not published yet"
          />
          {!!criticalPaths.length && (
            <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
              <p className="mb-2 text-sm font-semibold">Longest paths</p>
              <div className="space-y-1.5">
                {criticalPaths.slice(0, 3).map((path, index) => {
                  const labels = (path || []).map((uuid) => {
                    const a = activities.find((x) => String(x.uuid) === String(uuid));
                    return a?.activityCode || a?.name || String(uuid).slice(0, 8);
                  });
                  return (
                    <div key={`client-path-${index}-${labels.join(">")}`} className="flex items-start gap-2 text-xs">
                      <Badge className={index === 0 ? "bg-amber-500/15 text-amber-800" : "bg-secondary text-muted-foreground"}>
                        {index === 0 ? "Critical" : `Path ${index + 1}`}
                      </Badge>
                      <span className="font-mono text-muted-foreground">{labels.join(" → ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
