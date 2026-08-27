import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, CalendarDays, CheckCircle2, Clock,
  MapPin, ArrowRight, Loader2,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";

const STATUS_BADGE = {
  SCHEDULED: "bg-amber-500/15 text-amber-700 border-none",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 border-none",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 border-none",
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  Completed: "bg-emerald-500/15 text-emerald-700 border-none",
  Planning: "bg-amber-500/15 text-amber-700 border-none",
  Scheduled: "bg-amber-500/15 text-amber-700 border-none",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = todayStr();
  const [visits, setVisits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchMySiteVisits().catch(() => []),
      fetchAllProjects().catch(() => []),
    ]).then(([v, p]) => {
      if (cancelled) return;
      setVisits(Array.isArray(v) ? v : []);
      setProjects(Array.isArray(p) ? p : []);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => ({
    projects: projects.length,
    scheduled: visits.filter((v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS").length,
    completed: visits.filter((v) => v.status === "COMPLETED").length,
    today: visits.filter((v) => v.scheduledDate === today).length,
  }), [projects, visits, today]);

  const upcomingVisits = visits
    .filter((v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS")
    .slice(0, 3);

  return (
    <PageShell>
      <PageTitle
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Your assigned site visits and projects"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Projects" value={stats.projects} icon={Briefcase} />
        <StatTile label="Upcoming visits" value={stats.scheduled} icon={CalendarDays} />
        <StatTile label="Completed visits" value={stats.completed} icon={CheckCircle2} />
        <StatTile label="Today" value={stats.today} icon={Clock} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Upcoming site visits</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.EMPLOYEE.SITE_VISITS)}>
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
                    navigate(ROUTES.EMPLOYEE.SITE_VISIT_REPORT.replace(":visitId", v.uuid))
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
            <h2 className="text-base font-semibold tracking-tight">Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.EMPLOYEE.PROJECTS)}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No projects available.</p>
            ) : (
              projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name || p.projectName}</p>
                    <p className="text-xs text-muted-foreground">{p.clientName || p.location || "—"}</p>
                  </div>
                  <Badge className={STATUS_BADGE[p.status] || "bg-muted text-muted-foreground border-none"}>
                    {p.status || "Active"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
