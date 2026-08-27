import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GanttChart, Loader2, Search } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAllProjects } from "../../api/projects.api";
import { fetchPlanningStatus } from "../../api/planning.api";
import { fetchProjectSchedule } from "../../api/schedule.api";
import { ROUTES } from "@/shared/constants/routes";

function weightedPercent(activities = []) {
  if (!activities.length) return 0;
  let wSum = 0;
  let pSum = 0;
  activities.forEach((a) => {
    const w = Number(a.weight) || 1;
    wSum += w;
    pSum += w * (Number(a.percentComplete) || 0);
  });
  return wSum ? Math.round(pSum / wSum) : 0;
}

function statusChip(label, tone) {
  const tones = {
    muted: "bg-secondary text-muted-foreground",
    amber: "bg-amber-500/15 text-amber-800",
    blue: "bg-sky-500/15 text-sky-800",
    green: "bg-emerald-500/15 text-emerald-800",
    copper: "bg-copper/15 text-copper-foreground",
  };
  return <Badge className={tones[tone] || tones.muted}>{label}</Badge>;
}

async function loadMeta(projectId) {
  const [planningRes, scheduleRes] = await Promise.allSettled([
    fetchPlanningStatus(projectId),
    fetchProjectSchedule(projectId),
  ]);
  const planning = planningRes.status === "fulfilled" ? planningRes.value : null;
  const schedule = scheduleRes.status === "fulfilled" ? scheduleRes.value : null;
  const activities = schedule?.activities || [];
  return {
    planningReady: !!planning?.planningReady || !!planning?.ganttPublishAllowed,
    activityCount: activities.length,
    published: activities.some((a) => a.publishStatus === "PUBLISHED"),
    percent: weightedPercent(activities),
    metaLoaded: true,
  };
}

/** Run async work with a small concurrency limit to avoid hammering the API. */
async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export default function ScheduleHubPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPm = location.pathname.startsWith("/project-manager");
  const routes = isPm ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setEnriching(false);
      try {
        const projects = await fetchAllProjects();
        if (cancelled) return;
        const list = Array.isArray(projects) ? projects : [];
        const base = list.map((p) => ({
          id: p.id,
          name: p.projectName || p.name || `Project ${p.id}`,
          clientName: p.clientName || "—",
          status: p.status || "—",
          planningReady: false,
          activityCount: 0,
          published: false,
          percent: 0,
          metaLoaded: false,
        }));
        setRows(base);
        setLoading(false);

        if (!base.length) return;
        setEnriching(true);
        await mapPool(base, 3, async (row) => {
          if (cancelled) return null;
          try {
            const meta = await loadMeta(row.id);
            if (cancelled) return null;
            setRows((prev) =>
              prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...meta } : r))
            );
            return meta;
          } catch {
            if (!cancelled) {
              setRows((prev) =>
                prev.map((r) =>
                  String(r.id) === String(row.id) ? { ...r, metaLoaded: true } : r
                )
              );
            }
            return null;
          }
        });
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setEnriching(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        String(r.clientName).toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [rows, search]);

  const openWorkspace = (projectId) => {
    navigate(routes.PROJECT_SCHEDULE.replace(":projectId", projectId));
  };

  return (
    <PageShell>
      <PageTitle
        title="Schedule"
        subtitle="Pick a project to plan readiness, edit the Gantt, and post progress in one workspace."
        actions={
          enriching ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating status…
            </span>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild variant="outline">
          <Link to={routes.PROJECTS}>All projects</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Surface className="p-10 text-center text-sm text-muted-foreground">
          No projects found. Create a project first, then open Schedule.
        </Surface>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openWorkspace(r.id)}
              className="flex w-full flex-col gap-3 rounded-2xl bg-card px-4 py-4 text-left shadow-[0_1px_0_oklch(var(--border)/0.7),0_12px_32px_-24px_oklch(0.2_0.02_285/0.18)] transition hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold tracking-tight">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  #{r.id} · {r.clientName} · {r.status}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!r.metaLoaded ? (
                  statusChip("Loading…", "muted")
                ) : (
                  <>
                    {statusChip(
                      r.planningReady ? "Planning ready" : "Planning pending",
                      r.planningReady ? "green" : "amber"
                    )}
                    {statusChip(
                      r.activityCount === 0
                        ? "No activities"
                        : r.published
                          ? "Published"
                          : "Draft schedule",
                      r.activityCount === 0 ? "muted" : r.published ? "copper" : "blue"
                    )}
                    {statusChip(`${r.percent}% complete`, "muted")}
                  </>
                )}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                  <GanttChart className="h-3.5 w-3.5" /> Open
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}
