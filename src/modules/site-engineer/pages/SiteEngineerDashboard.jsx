import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchMySiteEngineerTasks } from "@/modules/site-engineer/api/site-engineer-tasks.api";
import { fetchMySnags } from "@/modules/site-engineer/api/snags.api";
import { fetchMySiteEngineerProjects } from "@/modules/site-engineer/api/projects.api";

const STATUS_BADGE = {
  SCHEDULED: "bg-amber-500/15 text-amber-700 border-none",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 border-none",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 border-none",
  TODO: "bg-amber-500/15 text-amber-700 border-none",
  DONE: "bg-emerald-500/15 text-emerald-700 border-none",
};

function fmtDate(d) {
  if (!d) return "—";
  const raw = String(d).includes("T") ? d : `${d}T00:00:00`;
  return new Date(raw).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function isOverdue(deadline, status) {
  if (!deadline || status === "DONE" || status === "CANCELLED") return false;
  const day = String(deadline).slice(0, 10);
  return day < todayStr();
}

export default function SiteEngineerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = todayStr();
  const [visits, setVisits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMySiteVisits().catch(() => []),
      fetchMySiteEngineerProjects().catch(() => []),
      fetchMySiteEngineerTasks().catch(() => []),
      fetchMySnags().catch(() => []),
    ]).then(([v, p, t, s]) => {
      if (cancelled) return;
      setVisits(Array.isArray(v) ? v : []);
      setProjects(Array.isArray(p) ? p : []);
      setTasks(Array.isArray(t) ? t : []);
      setSnags(Array.isArray(s) ? s : []);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
    return {
      projects: projects.length,
      scheduled: visits.filter((v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS").length,
      completed: visits.filter((v) => v.status === "COMPLETED").length,
      today: visits.filter((v) => v.scheduledDate === today).length,
      overdueTasks: openTasks.filter((t) => isOverdue(t.deadline, t.status)).length,
      openSnags: snags.filter((s) => s.status !== "CLOSED" && s.status !== "RESOLVED").length,
    };
  }, [projects, visits, tasks, snags, today]);

  const upcomingVisits = visits
    .filter((v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS")
    .slice(0, 3);

  const urgentTasks = tasks
    .filter((t) => t.status !== "DONE" && t.status !== "CANCELLED")
    .sort((a, b) => String(a.deadline || "").localeCompare(String(b.deadline || "")))
    .slice(0, 3);

  return (
    <PageShell>
      <PageTitle
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Your site visits, tasks, and assigned projects"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Projects" value={stats.projects} icon={Briefcase} />
        <StatTile label="Upcoming visits" value={stats.scheduled} icon={CalendarDays} />
        <StatTile label="Completed visits" value={stats.completed} icon={CheckCircle2} />
        <StatTile label="Today" value={stats.today} icon={Clock} />
        <StatTile label="Overdue tasks" value={stats.overdueTasks} icon={ClipboardList} />
        <StatTile label="Open snags" value={stats.openSnags} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Upcoming site visits</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SITE_ENGINEER.SITE_VISITS)}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {upcomingVisits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming visits assigned.</p>
            ) : (
              upcomingVisits.map((v) => (
                <button
                  key={v.uuid}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
                  onClick={() =>
                    navigate(ROUTES.SITE_ENGINEER.SITE_VISIT_REPORT.replace(":visitId", v.uuid))
                  }
                >
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Visit {v.uuid?.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(v.scheduledDate)} · {v.scheduledTime || "—"}
                    </p>
                  </div>
                  <Badge className={STATUS_BADGE[v.status] || ""}>{v.status}</Badge>
                </button>
              ))
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Tasks</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SITE_ENGINEER.TASKS)}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              urgentTasks.map((t) => (
                <button
                  key={t.uuid}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:bg-secondary/70"
                  onClick={() => navigate(ROUTES.SITE_ENGINEER.TASKS)}
                >
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {fmtDate(t.deadline)}
                      {isOverdue(t.deadline, t.status) ? " · Overdue" : ""}
                    </p>
                  </div>
                  <Badge className={STATUS_BADGE[t.status] || "bg-muted border-none"}>{t.status}</Badge>
                </button>
              ))
            )}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
