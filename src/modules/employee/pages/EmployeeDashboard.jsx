import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, CalendarDays, CheckCircle2, Clock,
  MapPin, ArrowRight,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/shared/constants/routes";

// ── Mock data scoped to "James Wu" (emp-001) ─────────────────────────────────
const MY_EMPLOYEE = {
  name: "James Wu",
  designation: "Sales Executive",
  department: "Sales",
  employeeId: "EMP-2024-001",
};

const MY_PROJECTS = [
  {
    id: "PRJ-201",
    name: "Luxury Penthouse Fit-Out",
    client: "Claire Moss",
    location: "Surry Hills, NSW",
    status: "In Progress",
    progress: 65,
    role: "Sales Lead",
  },
  {
    id: "PRJ-203",
    name: "Moss Interiors Showroom",
    client: "Moss Interiors",
    location: "Surry Hills, NSW",
    status: "In Progress",
    progress: 40,
    role: "Coordinator",
  },
];

const MY_VISITS = [
  { id: "v1", project: "Luxury Penthouse Fit-Out", site: "Surry Hills, NSW",    date: "2026-06-18", time: "10:00 AM", status: "Scheduled" },
  { id: "v2", project: "Moss Interiors Showroom",  site: "Surry Hills, NSW",    date: "2026-06-21", time: "02:00 PM", status: "Scheduled" },
  { id: "v3", project: "Luxury Penthouse Fit-Out", site: "Sydney CBD, NSW",     date: "2026-06-04", time: "09:30 AM", status: "Completed" },
];

const STATUS_BADGE = {
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  "Completed":   "bg-emerald-500/15 text-emerald-700 border-none",
  "Planning":    "bg-amber-500/15 text-amber-700 border-none",
  "Scheduled":   "bg-amber-500/15 text-amber-700 border-none",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const today = todayStr();

  const stats = useMemo(() => ({
    projects: MY_PROJECTS.length,
    scheduled: MY_VISITS.filter((v) => v.status === "Scheduled").length,
    completed: MY_VISITS.filter((v) => v.status === "Completed").length,
    today: MY_VISITS.filter((v) => v.date === today).length,
  }), [today]);

  const upcomingVisits = MY_VISITS.filter((v) => v.status === "Scheduled").slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${MY_EMPLOYEE.name.split(" ")[0]}`}
        description={`${MY_EMPLOYEE.designation} · ${MY_EMPLOYEE.department} · ${MY_EMPLOYEE.employeeId}`}
      />

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "My Projects",       value: stats.projects,  icon: Briefcase,     bg: "bg-primary/10 text-primary" },
          { label: "Upcoming Visits",   value: stats.scheduled, icon: CalendarDays,  bg: "bg-amber-500/10 text-amber-600" },
          { label: "Completed Visits",  value: stats.completed, icon: CheckCircle2,  bg: "bg-emerald-500/10 text-emerald-600" },
          { label: "Visits Today",      value: stats.today,     icon: Clock,         bg: "bg-blue-500/10 text-blue-600" },
        ].map(({ label, value, icon: Icon, bg }) => (
          <Card key={label} className="border-border/60 shadow-sm hover:border-primary/25 hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Projects */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">My Projects</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => navigate(ROUTES.EMPLOYEE.PROJECTS)}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {MY_PROJECTS.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(ROUTES.EMPLOYEE.PROJECTS)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium leading-tight">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.client}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[p.status]} shrink-0 text-[10px]`}>{p.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{p.location}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming site visits */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming Site Visits</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => navigate(ROUTES.EMPLOYEE.CALENDAR)}
            >
              Calendar <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingVisits.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No upcoming site visits scheduled.
              </div>
            ) : (
              upcomingVisits.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold leading-tight">
                      {new Date(v.date + "T00:00").toLocaleDateString("en-AU", { month: "short" }).toUpperCase()}
                    </span>
                    <span className="text-base font-bold leading-tight">
                      {new Date(v.date + "T00:00").getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.project}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {v.site}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(v.date)} · {v.time}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[v.status]} shrink-0 text-[10px]`}>{v.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
