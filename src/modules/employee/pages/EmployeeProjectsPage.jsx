import { useState } from "react";
import { Briefcase, CalendarDays, DollarSign, MapPin, TrendingUp, Users } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { projectStore } from "@/shared/store/projectStore";
import { INITIAL_EMPLOYEES } from "@/modules/admin/data/employees";

// Projects assigned to this employee (James Wu → emp-001)
const MY_PROJECT_IDS = ["PRJ-201", "PRJ-202"];

const STATUS_BADGE = {
  "In Progress": "bg-blue-500/15 text-blue-700 border-none",
  "Completed":   "bg-emerald-500/15 text-emerald-700 border-none",
  "Planning":    "bg-amber-500/15 text-amber-700 border-none",
  "On Hold":     "bg-orange-500/15 text-orange-700 border-none",
  "Cancelled":   "bg-destructive/15 text-destructive border-none",
};

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function EmployeeProjectsPage() {
  const allProjects = projectStore.getProjects();
  const myProjects = allProjects.filter((p) => MY_PROJECT_IDS.includes(p.id));
  const [selected, setSelected] = useState(myProjects[0] || null);

  const visits = selected ? projectStore.getSiteVisits(selected.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Projects"
          description="Projects you are assigned to. Click a project to view details."
        />
        <Button>Start QAS</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        {/* Project list */}
        <div className="space-y-3">
          {myProjects.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-16 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No projects assigned yet.</p>
              </CardContent>
            </Card>
          ) : (
            myProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`w-full text-left rounded-xl border p-4 space-y-3 transition-all ${
                  selected?.id === p.id
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card hover:border-primary/25 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{p.projectName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.clientName}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[p.status]} shrink-0 text-[10px]`}>{p.status}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {p.location}
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
              </button>
            ))
          )}
        </div>

        {/* Project detail */}
        {selected ? (
          <div className="space-y-5">
            {/* Header */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{selected.id}</p>
                    <h2 className="text-xl font-bold mt-0.5">{selected.projectName}</h2>
                    <p className="text-sm text-muted-foreground">{selected.clientName} · {selected.location}</p>
                  </div>
                  <Badge className={`${STATUS_BADGE[selected.status]} text-sm px-3 py-1`}>{selected.status}</Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Execution Progress</span>
                    <span className="font-bold text-primary">{selected.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${selected.progress}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Contract Value", value: `$${selected.budget?.toLocaleString()}`, icon: DollarSign, bg: "bg-primary/10 text-primary" },
                { label: "Start Date",     value: selected.startDate,                      icon: CalendarDays, bg: "bg-blue-500/10 text-blue-600" },
                { label: "Target Date",    value: selected.expectedCompletionDate,         icon: TrendingUp, bg: "bg-emerald-500/10 text-emerald-600" },
              ].map(({ label, value, icon: Icon, bg }) => (
                <Card key={label} className="border-border/60 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bg}`}><Icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Project info */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{selected.description}</p>
                  <Separator className="mb-3" />
                  <InfoRow label="Type"     value={selected.projectType} />
                  <InfoRow label="Location" value={selected.location} />
                  <InfoRow label="Manager"  value={selected.assignedManager || "Unassigned"} />
                  <InfoRow label="Client"   value={selected.clientName} />
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />My Site Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {visits.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-6">No site visits for this project.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {visits.map((sv) => (
                        <div
                          key={sv.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium">{sv.date} · {sv.time}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sv.purpose}</p>
                          </div>
                          <Badge
                            className={
                              sv.status === "Completed"
                                ? "bg-emerald-500/15 text-emerald-700 border-none text-[10px] shrink-0"
                                : "bg-amber-500/15 text-amber-700 border-none text-[10px] shrink-0"
                            }
                          >
                            {sv.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Project Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {INITIAL_EMPLOYEES.slice(0, 4).map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{emp.designation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border/60">
            <CardContent className="py-24 text-center">
              <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select a project to view details.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
