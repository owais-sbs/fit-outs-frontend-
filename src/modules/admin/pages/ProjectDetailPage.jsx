import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft, DollarSign, CalendarDays, Clock,
  TrendingUp, Building2, Briefcase, Users, MapPin, FileImage, FileText, GanttChart,
  AlertTriangle, BarChart3, CreditCard, HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { fetchProjectById, updateProject } from "../api/projects.api";
import { fetchAllClients } from "../api/clients.api";
import { fetchBoqsByProject } from "../api/boq.api";
import { ROUTES } from "@/shared/constants/routes";
import { BoqStatusBadge } from "./boq/BoqApprovalTimeline";
import { formatCurrency } from "./boq/quantityCalcUtils";
import { INITIAL_EMPLOYEES } from "@/modules/admin/data/employees";
import ProjectRoomsSection from "./roomcollab/ProjectRoomsSection";
import { fetchPlanningStatus } from "../api/planning.api";

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
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const routes = isPm ? ROUTES.PROJECT_MANAGER : ROUTES.ADMIN;
  const schedulePath = routes.PROJECT_SCHEDULE.replace(":projectId", projectId);
  const snagsPath = routes.PROJECT_SNAGS.replace(":projectId", projectId);
  const documentsPath = routes.PROJECT_DOCUMENTS.replace(":projectId", projectId);
  const reportingPath = routes.PROJECT_REPORTING.replace(":projectId", projectId);
  const billingPath = routes.PROJECT_BILLING.replace(":projectId", projectId);
  const subcontractorsPath = routes.PROJECT_SUBCONTRACTORS.replace(":projectId", projectId);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [boqs, setBoqs] = useState([]);
  const [boqsLoading, setBoqsLoading] = useState(true);
  const [planningReady, setPlanningReady] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientSaving, setClientSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchProjectById(projectId)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const loadBoqs = useCallback(() => {
    setBoqsLoading(true);
    fetchBoqsByProject(projectId)
      .then((list) => setBoqs(Array.isArray(list) ? list : []))
      .catch(() => setBoqs([]))
      .finally(() => setBoqsLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
    loadBoqs();
    fetchAllClients()
      .then((list) => setClients(Array.isArray(list) ? list : []))
      .catch(() => setClients([]));
    fetchPlanningStatus(projectId)
      .then((p) => setPlanningReady(!!p?.planningReady || !!p?.ganttPublishAllowed))
      .catch(() => setPlanningReady(null));
  }, [load, loadBoqs, projectId]);

  const handleStatusChange = async (newStatus) => {
    setProject((p) => ({ ...p, status: newStatus }));
    setSaving(true);
    setSaveMessage("");
    try {
      const updated = await updateProject(projectId, { status: newStatus });
      setProject(updated);
      setSaveMessage("Status saved.");
    } catch {
      setSaveMessage("Failed to save status.");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = async (clientId) => {
    setClientSaving(true);
    setSaveMessage("");
    try {
      const updated = await updateProject(projectId, { clientId: Number(clientId) });
      setProject(updated);
      setSaveMessage("Client assigned.");
    } catch {
      setSaveMessage("Failed to assign client.");
      load();
    } finally {
      setClientSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell className="max-w-6xl mx-auto">
        <Card><CardContent className="py-24"><Skeleton className="h-8 w-48 mx-auto" /></CardContent></Card>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <div className="page-enter py-16 text-center text-muted-foreground">
        <p className="font-semibold text-lg">Project not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4" size="sm">Go Back</Button>
      </div>
    );
  }

  return (
    <PageShell className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">Back to projects</span>
      </div>

      <PageTitle
        title={project.projectName}
        subtitle={`${project.id} · ${project.clientName} · ${project.location}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status} />
            <Button asChild size="sm" variant="outline">
              <Link to={ROUTES.ADMIN.PROJECT_DRAWINGS.replace(":projectId", projectId)}>
                <FileImage className="w-4 h-4 mr-1" /> Drawings
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={schedulePath}>
                <GanttChart className="w-4 h-4 mr-1" /> Schedule
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={snagsPath}>
                <AlertTriangle className="w-4 h-4 mr-1" /> Snags
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={documentsPath}>
                <FileText className="w-4 h-4 mr-1" /> Documents
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={reportingPath}>
                <BarChart3 className="w-4 h-4 mr-1" /> Reporting
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={billingPath}>
                <CreditCard className="w-4 h-4 mr-1" /> Billing
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={subcontractorsPath}>
                <HardHat className="w-4 h-4 mr-1" /> Subcontractors
              </Link>
            </Button>
            <Select value={project.status} onValueChange={handleStatusChange} disabled={saving}>
              <SelectTrigger className="w-[135px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Planning","In Progress","On Hold","Completed","Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {saveMessage && (
        <p className="text-sm text-muted-foreground">{saveMessage}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Contract Value"
          value={`AED ${Number(project.budget || 0).toLocaleString()}`}
          icon={DollarSign}
        />
        <StatTile
          label="Overall Progress"
          value={`${project.progress}%`}
          icon={TrendingUp}
        />
        <StatTile
          label="Start Date"
          value={project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
          icon={CalendarDays}
        />
        <StatTile
          label="Target Completion"
          value={project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : "—"}
          icon={Clock}
        />
      </div>

      <Card>
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

      <div className="flex flex-col gap-3 rounded-2xl bg-secondary/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Schedule workspace</p>
          <p className="text-xs text-muted-foreground">
            Planning readiness, Gantt, and progress live in one place.
            {planningReady === true && " Planning is ready to publish."}
            {planningReady === false && " Planning not marked ready yet."}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to={schedulePath}>
            <GanttChart className="h-4 w-4 mr-1" /> Open schedule
          </Link>
        </Button>
      </div>

      {/* BOQ documents */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            BOQ Documents
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to={`${ROUTES.ADMIN.QAS}?projectId=${projectId}`}>New survey BOQ</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {boqsLoading ? (
            <p className="text-sm text-muted-foreground">Loading BOQs…</p>
          ) : boqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No BOQs saved for this project yet.</p>
          ) : (
            <div className="space-y-2">
              {boqs.map((boq) => (
                <div
                  key={boq.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold">v{boq.version}</span>
                      <BoqStatusBadge status={boq.status} />
                      {boq.revisionLabel && (
                        <span className="text-xs text-muted-foreground">{boq.revisionLabel}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {boq.lines?.length || 0} lines · Updated {boq.updatedAt ? new Date(boq.updatedAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums text-sm">{formatCurrency(boq.grandTotal)}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`${ROUTES.ADMIN.BOQ}?boqId=${boq.id}&projectId=${projectId}`}>Open</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectRoomsSection projectId={projectId} projectName={project.projectName || project.name} />

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project scope */}
        <Card className="lg:col-span-2">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Assign client account</Label>
                <Select
                  value={project.clientId ? String(project.clientId) : ""}
                  onValueChange={handleClientChange}
                  disabled={clientSaving}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select client for portal access" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.fullName} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          <Card>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Assigned Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INITIAL_EMPLOYEES.slice(0, 8).map((emp) => {
              const inits = (emp.employeeName || "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={emp.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {inits}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{emp.employeeName}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.designation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Site visits summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Site Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            {[
              { label: "Total",     value: 0, c: "text-foreground" },
              { label: "Scheduled", value: 0, c: "text-amber-600" },
              { label: "Completed", value: 0, c: "text-emerald-600" },
            ].map(({ label, value, c }) => (
              <div key={label} className="rounded-lg bg-muted/30 p-3">
                <p className={`text-xl font-bold ${c}`}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground py-4">No site visits scheduled yet.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
