import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Briefcase, Building2, CalendarDays,
  Clock, DollarSign, TrendingUp, Users,
} from "lucide-react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchProjectById } from "@/modules/admin/api/projects.api";
import { fetchIssuedEstimatesForClient } from "@/modules/admin/api/site-visits.api";
import { ROUTES } from "@/shared/constants/routes";
import ClientProjectRoomsSection from "./ClientProjectRoomsSection";

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-2 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = {
    "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-none font-medium",
    "Completed":   "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-none font-medium",
    "Planning":    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-medium",
    "On Hold":     "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-none font-medium",
    "Cancelled":   "destructive",
  };
  return <Badge className={cls[status] || ""}>{status}</Badge>;
}

export default function ClientProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchProjectById(projectId),
      fetchIssuedEstimatesForClient().catch(() => []),
    ])
      .then(([apiProj, issued]) => {
        if (!apiProj) throw new Error("empty");
        setProject({
          id: apiProj.id,
          projectName: apiProj.name || apiProj.projectName,
          clientName: apiProj.clientName || "Client",
          location: apiProj.location,
          status: apiProj.status || "Planning",
          progress: apiProj.progress ?? 0,
          budget: apiProj.budget ?? 0,
          description: apiProj.description,
          projectType: apiProj.projectType,
          assignedManager: apiProj.assignedManager,
          startDate: apiProj.startDate,
          expectedCompletionDate: apiProj.expectedCompletionDate,
        });
        setEstimates(Array.isArray(issued) ? issued : []);
      })
      .catch(() => {
        setProject(null);
        setEstimates([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <PageShell className="mx-auto max-w-6xl">
        <div className="py-16 text-center text-sm text-muted-foreground">Loading project…</div>
      </PageShell>
    );
  }

  const budget = Number(project?.budget) || 0;

  if (!project) {
    return (
      <PageShell className="mx-auto max-w-6xl">
        <div className="py-16 text-center text-muted-foreground">
          <p className="font-display text-lg font-semibold">Project not found</p>
          <Button onClick={() => navigate(ROUTES.CLIENT.PROJECTS_MY)} className="mt-4" size="sm">
            Back to My Projects
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Back to projects</span>
      </div>

      <PageTitle
        title={project.projectName}
        subtitle={`${project.id} · ${project.clientName} · ${project.location}`}
        actions={<StatusBadge status={project.status} />}
      />

      <ClientProjectRoomsSection projectId={projectId} projectName={project.projectName} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Contract Value"
          value={`$${budget.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatTile
          label="Overall Progress"
          value={`${project.progress}%`}
          icon={TrendingUp}
        />
        <StatTile
          label="Start Date"
          value={project.startDate}
          icon={CalendarDays}
        />
        <StatTile
          label="Target Completion"
          value={project.expectedCompletionDate}
          icon={Clock}
        />
      </div>

      <Surface className="p-5">
        <div className="mb-2 flex items-center justify-between">
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
      </Surface>

      <div className="grid gap-6 lg:grid-cols-3">
        <Surface className="space-y-4 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="h-4 w-4 text-primary" />
            Project Scope
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
          <Separator className="opacity-40" />
          <div className="grid gap-x-6 sm:grid-cols-2">
            <div>
              <InfoItem label="Project ID"   value={project.id} mono />
              <InfoItem label="Project Type" value={project.projectType} />
              <InfoItem label="Location"     value={project.location} />
              <InfoItem label="Start Date"   value={project.startDate} />
              <InfoItem label="Target Date"  value={project.expectedCompletionDate} />
            </div>
            <div>
              <InfoItem label="Status"    value={project.status} />
              <InfoItem label="Manager"   value={project.assignedManager || "Unassigned"} />
              <InfoItem label="Budget"    value={`$${budget.toLocaleString()}`} />
              <InfoItem label="Progress"  value={`${project.progress}%`} />
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="space-y-3 p-5 text-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Support Contacts
            </h2>
            <div>
              <span className="block text-xs text-muted-foreground">Project Manager</span>
              <span className="font-semibold">{project.assignedManager || "Unassigned"}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">pm@fitouts.com.au</span>
            </div>
            <Separator className="opacity-40" />
            <div>
              <span className="block text-xs text-muted-foreground">Support Line</span>
              <span className="font-medium">+61 2 9876 5432</span>
            </div>
            <Separator className="opacity-40" />
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Project Health</p>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${project.progress >= 70 ? "bg-emerald-500" : project.progress >= 30 ? "bg-amber-500" : "bg-primary"}`} />
                <span className="text-xs font-medium">
                  {project.progress >= 70 ? "On Track" : project.progress >= 30 ? "In Progress" : "Early Stage"}
                </span>
              </div>
            </div>
          </Surface>

          <Surface className="space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <DollarSign className="h-4 w-4 text-primary" />
              Payment Summary
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Total",       value: `$${budget.toLocaleString()}`,                   c: "text-foreground" },
                { label: "Paid",        value: `$${Math.round(budget * 0.45).toLocaleString()}`, c: "text-emerald-600" },
                { label: "Outstanding", value: `$${Math.round(budget * 0.55).toLocaleString()}`, c: "text-amber-600" },
              ].map(({ label, value, c }) => (
                <div key={label} className="rounded-xl bg-secondary/50 p-2">
                  <p className={`text-xs font-bold ${c}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "45%" }} />
            </div>
            <p className="text-[11px] text-muted-foreground">45% collected</p>
          </Surface>
        </div>
      </div>

      {project.assignedManager && (
        <Surface className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Project Team
          </h2>
          <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3 sm:max-w-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {project.assignedManager
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{project.assignedManager}</p>
              <p className="truncate text-xs text-muted-foreground">Project Manager</p>
            </div>
          </div>
        </Surface>
      )}

      <Surface className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <DollarSign className="h-4 w-4 text-primary" />
          Issued Estimates
        </h2>
        {estimates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No issued estimates yet.</p>
        ) : (
          <div className="space-y-2">
            {estimates.map((est) => (
              <div
                key={est.uuid || est.quoteNo}
                className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{est.quoteNo || est.projectLabel || "Estimate"}</p>
                  <p className="text-xs text-muted-foreground">
                    {est.subject || est.locationLabel || "—"}
                    {est.validUntil ? ` · Valid until ${est.validUntil}` : ""}
                  </p>
                </div>
                <Badge variant="secondary">{est.status || "ISSUED"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
