import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, DollarSign, CalendarDays, Clock,
  TrendingUp, Building2, Briefcase, Users, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projectStore } from "@/shared/store/projectStore";
import { INITIAL_EMPLOYEES } from "@/modules/admin/data/employees";

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-none font-medium",
    "Completed":   "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none font-medium",
    "Planning":    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-medium",
    "On Hold":     "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-none font-medium",
    "Cancelled":   "destructive",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [siteVisits, setSiteVisits] = useState([]);

  const load = useCallback(() => {
    const proj = projectStore.getProjectById(projectId);
    if (!proj) return;
    setProject(proj);
    setSiteVisits(projectStore.getSiteVisits(projectId));
  }, [projectId]);

  useEffect(() => {
    load();
    window.addEventListener("storage_update", load);
    return () => window.removeEventListener("storage_update", load);
  }, [load]);

  if (!project) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="font-semibold text-lg">Project not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4" size="sm">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">Back to projects</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <span className="font-mono text-xs font-semibold text-muted-foreground">{project.id}</span>
          <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
          <p className="text-sm text-muted-foreground">{project.clientName} · {project.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          <Select value={project.status} onValueChange={(s) => { projectStore.updateProject(projectId, { status: s }); load(); }}>
            <SelectTrigger className="w-[135px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Planning","In Progress","On Hold","Completed","Cancelled"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Contract Value",    value: `$${project.budget?.toLocaleString()}`, icon: DollarSign,  bg: "bg-primary/10 text-primary" },
          { label: "Overall Progress",  value: `${project.progress}%`,                 icon: TrendingUp,  bg: "bg-emerald-500/10 text-emerald-600" },
          { label: "Start Date",        value: project.startDate,                      icon: CalendarDays, bg: "bg-blue-500/10 text-blue-600" },
          { label: "Target Completion", value: project.expectedCompletionDate,         icon: Clock,       bg: "bg-amber-500/10 text-amber-600" },
        ].map(({ label, value, icon: Icon, bg }) => (
          <Card key={label} className="border-border/60 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
                <p className="text-base font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Execution Progress</p>
            <span className="text-sm font-bold text-primary">{project.progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>Planning</span><span>Design</span><span>Build</span><span>Handover</span>
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project scope */}
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              Project Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            <Separator />
            <div className="grid gap-x-6 sm:grid-cols-2">
              <div>
                <InfoItem label="Project ID"     value={project.id} mono />
                <InfoItem label="Project Type"   value={project.projectType} />
                <InfoItem label="Location"       value={project.location} />
                <InfoItem label="Start Date"     value={project.startDate} />
                <InfoItem label="Target Date"    value={project.expectedCompletionDate} />
              </div>
              <div>
                <InfoItem label="Status"         value={project.status} />
                <InfoItem label="Manager"        value={project.assignedManager || "Unassigned"} />
                <InfoItem label="Budget"         value={`$${project.budget?.toLocaleString()}`} />
                <InfoItem label="Client"         value={project.clientName} />
                <InfoItem label="Progress"       value={`${project.progress}%`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client + Health */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Client Name" value={project.clientName} />
              <InfoItem label="Client ID"   value={project.clientId || "—"} mono />
              <InfoItem label="Location"    value={project.location} />
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Project Health</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${project.progress >= 70 ? "bg-emerald-500" : project.progress >= 30 ? "bg-amber-500" : "bg-primary"}`} />
                  <span className="text-xs font-medium">
                    {project.progress >= 70 ? "On Track" : project.progress >= 30 ? "In Progress" : "Early Stage"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment summary */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4 text-primary" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total",       value: `$${project.budget?.toLocaleString()}`,                     c: "text-foreground" },
                  { label: "Paid",        value: `$${Math.round(project.budget * 0.45).toLocaleString()}`,   c: "text-emerald-600" },
                  { label: "Outstanding", value: `$${Math.round(project.budget * 0.55).toLocaleString()}`,   c: "text-amber-600" },
                ].map(({ label, value, c }) => (
                  <div key={label} className="rounded-lg bg-muted/30 p-2">
                    <p className={`text-sm font-bold ${c}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "45%" }} />
              </div>
              <p className="text-[11px] text-muted-foreground">45% collected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Assigned Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INITIAL_EMPLOYEES.slice(0, 8).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site visits summary */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Site Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            {[
              { label: "Total",     value: siteVisits.length,                                         c: "text-foreground" },
              { label: "Scheduled", value: siteVisits.filter((v) => v.status === "Scheduled").length, c: "text-amber-600" },
              { label: "Completed", value: siteVisits.filter((v) => v.status === "Completed").length, c: "text-emerald-600" },
            ].map(({ label, value, c }) => (
              <div key={label} className="rounded-lg bg-muted/30 p-3">
                <p className={`text-xl font-bold ${c}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          {siteVisits.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No site visits scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {siteVisits.map((sv) => (
                <div key={sv.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{sv.employee}</p>
                    <p className="text-xs text-muted-foreground">{sv.date} · {sv.time} · {sv.purpose}</p>
                  </div>
                  <Badge
                    className={sv.status === "Completed"
                      ? "bg-emerald-500/15 text-emerald-700 border-none"
                      : "bg-amber-500/15 text-amber-700 border-none"}
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
  );
}
