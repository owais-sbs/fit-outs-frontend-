import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft, DollarSign, CalendarDays, Clock, Calendar, Pencil,
  TrendingUp, Building2, Briefcase, MapPin, FileImage, FileText, GanttChart,
  AlertTriangle, BarChart3, CreditCard, HardHat, ClipboardCheck, Stamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageShell, PageTitle, StatTile } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";
import { fetchProjectById, updateProject } from "../api/projects.api";
import { fetchAllClients } from "../api/clients.api";
import { fetchAllEmployees } from "../api/employees.api";
import { fetchCrewAssignments } from "../api/resource.api";
import { fetchProjectTeamAssignments } from "../api/project-team.api";
import { fetchBoqsByProject } from "../api/boq.api";
import { ROUTES, PROJECT_DETAIL_NAV_STATE, boqViewPath, portalRoutesFromPath } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { BoqStatusBadge } from "./boq/BoqApprovalTimeline";
import BoqApprovalPipeline from "./boq/BoqApprovalPipeline";
import { formatCurrency, formatAed } from "@/shared/utils/currency";
import { splitProjectBoqs } from "./boq/boqDataUtils";
import ProjectRoomsSection from "./roomcollab/ProjectRoomsSection";
import ProjectTeamAssignmentSection from "./ProjectTeamAssignmentSection";
import ProjectApprovalsSection from "./ProjectApprovalsSection";
import ProjectDeveloperInfo from "./ProjectDeveloperInfo";
import { fetchPlanningStatus } from "../api/planning.api";
import { fetchJurisdictionPacks, fetchApprovalsCatalog } from "../api/approvals-config.api";
import { PROJECT_TYPES } from "../constants/project.constants";
import { ROLES } from "@/shared/constants/roles";

const NATURE_NONE = "__none__";
const PM_ASSIGNABLE_ROLES = [ROLES.PROJECT_MANAGER, ROLES.BUSINESS_OWNER, ROLES.ADMIN];

function toDateInput(value) {
  if (!value) return "";
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
    </div>
  );
}

const STATUS_OPTIONS = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];

const STATUS_COLORS = {
  "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Planning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "On Hold": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function StatusBadge({ status }) {
  return (
    <Badge className={cn("border-none font-medium", STATUS_COLORS[status])}>{status}</Badge>
  );
}

function StatusSelect({ value, onValueChange, disabled }) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-8 w-auto min-w-[8.5rem] gap-1 rounded-full border-none px-3 text-xs font-medium shadow-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/30",
          STATUS_COLORS[value] || "bg-secondary text-foreground"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[status])}>
              {status}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function resolveManagerDisplay(project, teamAssignments = [], employees = []) {
  const pm = teamAssignments.find((a) => a.role === "PROJECT_MANAGER");
  if (pm?.displayName) return pm.displayName;

  const assignedManager = project?.assignedManager;
  if (!assignedManager?.trim()) return "Unassigned";

  const key = assignedManager.trim().toLowerCase();
  const match = employees.find(
    (emp) =>
      emp.employeeName?.trim().toLowerCase() === key ||
      emp.email?.trim().toLowerCase() === key
  );
  return match?.employeeName || assignedManager;
}

function projectSubPath(routes, key, projectId) {
  const template = routes?.[key];
  return template ? template.replace(":projectId", projectId) : null;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const { role } = useAuth();
  const isPm = location.pathname.startsWith("/project-manager");
  const isFinance = location.pathname.startsWith("/finance");
  const routes = portalRoutesFromPath(location.pathname);
  const projectsListPath = isFinance ? ROUTES.FINANCE.PROJECTS : routes.PROJECTS;
  const drawingsPath = projectSubPath(routes, "PROJECT_DRAWINGS", projectId);
  const schedulePath = projectSubPath(routes, "PROJECT_SCHEDULE", projectId);
  const approvalsPath = projectSubPath(routes, "PROJECT_APPROVALS", projectId);
  const snagsPath = projectSubPath(routes, "PROJECT_SNAGS", projectId);
  const documentsPath = projectSubPath(routes, "PROJECT_DOCUMENTS", projectId);
  const reportingPath = projectSubPath(routes, "PROJECT_REPORTING", projectId);
  const billingPath = projectSubPath(routes, "PROJECT_BILLING", projectId);
  const subcontractorsPath = projectSubPath(routes, "PROJECT_SUBCONTRACTORS", projectId);
  const validationPath = projectSubPath(routes, "PROJECT_VALIDATION", projectId);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [boqs, setBoqs] = useState([]);
  const [boqsLoading, setBoqsLoading] = useState(true);
  const [planningReady, setPlanningReady] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientSaving, setClientSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [crewAssignments, setCrewAssignments] = useState([]);
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [jurisdictionPacks, setJurisdictionPacks] = useState([]);
  const [projectNatures, setProjectNatures] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsForm, setDetailsForm] = useState({
    projectType: "",
    approvalProjectNatureId: "",
    jurisdictionPackId: "",
    startDate: "",
    expectedCompletionDate: "",
    assignedManager: "",
    clientId: "",
  });

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
    fetchAllEmployees()
      .then((list) => setEmployees(Array.isArray(list) ? list.filter((e) => e.isActive !== false) : []))
      .catch(() => setEmployees([]));
    fetchCrewAssignments(projectId)
      .then((list) => setCrewAssignments(Array.isArray(list) ? list : []))
      .catch(() => setCrewAssignments([]));
    fetchProjectTeamAssignments(projectId)
      .then(setTeamAssignments)
      .catch(() => setTeamAssignments([]));
    fetchJurisdictionPacks(true)
      .then((list) => setJurisdictionPacks(Array.isArray(list) ? list : []))
      .catch(() => setJurisdictionPacks([]));
    fetchApprovalsCatalog()
      .then((catalog) => {
        setProjectNatures(Array.isArray(catalog?.projectNatures) ? catalog.projectNatures : []);
      })
      .catch(() => setProjectNatures([]));
  }, [load, loadBoqs, projectId]);

  const managerDisplay = useMemo(
    () => resolveManagerDisplay(project, teamAssignments, employees),
    [project, teamAssignments, employees]
  );

  const managerOptions = useMemo(() => {
    const managers = employees.filter(
      (emp) => !emp.role || PM_ASSIGNABLE_ROLES.includes(emp.role) || emp.role === ROLES.PROJECT_MANAGER
    );
    return managers.length > 0 ? managers : employees;
  }, [employees]);

  const projectTypeOptions = useMemo(() => {
    const types = [...PROJECT_TYPES];
    if (project?.projectType && !types.includes(project.projectType) && project.projectType !== "—") {
      types.unshift(project.projectType);
    }
    return types;
  }, [project?.projectType]);

  const natureName = useMemo(() => {
    const id = project?.approvalProjectNatureId;
    if (!id) return "Not set";
    const match = projectNatures.find((item) => String(item.id) === String(id));
    return match?.name || "Not set";
  }, [project?.approvalProjectNatureId, projectNatures]);

  const labourCrews = useMemo(() => {
    const seen = new Set();
    return (crewAssignments || []).reduce((list, assignment) => {
      const crewName = assignment?.crewName?.trim();
      if (!crewName || seen.has(crewName.toLowerCase())) return list;
      seen.add(crewName.toLowerCase());
      list.push({
        id: `crew-${assignment.crewUuid || assignment.uuid || crewName}`,
        name: crewName,
      });
      return list;
    }, []);
  }, [crewAssignments]);

  const { live: liveBoq, history: boqHistory, frozen: boqFrozen } = useMemo(
    () => splitProjectBoqs(boqs),
    [boqs]
  );

  const handleTeamSaved = (updated) => {
    setTeamAssignments(updated);
    load();
  };

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
      const client = clients.find((c) => String(c.id) === String(clientId));
      setProject({ ...updated, clientName: client?.fullName || updated.clientName });
      setSaveMessage("Client assigned.");
    } catch {
      setSaveMessage("Failed to assign client.");
      load();
    } finally {
      setClientSaving(false);
    }
  };

  const openDetailsEdit = () => {
    setDetailsForm({
      projectType: project.projectType && project.projectType !== "—" ? project.projectType : PROJECT_TYPES[0],
      approvalProjectNatureId: project.approvalProjectNatureId ? String(project.approvalProjectNatureId) : "",
      jurisdictionPackId: project.jurisdictionPackId ? String(project.jurisdictionPackId) : "",
      startDate: toDateInput(project.startDate),
      expectedCompletionDate: toDateInput(project.expectedCompletionDate),
      assignedManager:
        project.assignedManager && project.assignedManager !== "Unassigned" ? project.assignedManager : "",
      clientId: project.clientId ? String(project.clientId) : "",
    });
    setDetailsOpen(true);
  };

  const setDetailsField = (field, value) => {
    setDetailsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async () => {
    setDetailsSaving(true);
    setSaveMessage("");
    try {
      const updated = await updateProject(projectId, {
        projectType: detailsForm.projectType,
        approvalProjectNatureId: detailsForm.approvalProjectNatureId || undefined,
        jurisdictionPackId: detailsForm.jurisdictionPackId || undefined,
        startDate: detailsForm.startDate || null,
        expectedCompletionDate: detailsForm.expectedCompletionDate || null,
        assignedManager: detailsForm.assignedManager || undefined,
        clientId: detailsForm.clientId ? Number(detailsForm.clientId) : undefined,
      });
      const client = clients.find((c) => String(c.id) === String(detailsForm.clientId));
      setProject({
        ...updated,
        clientName: client?.fullName || updated.clientName,
        approvalProjectNatureId: detailsForm.approvalProjectNatureId || updated.approvalProjectNatureId,
        jurisdictionPackId: detailsForm.jurisdictionPackId || updated.jurisdictionPackId,
      });
      setDetailsOpen(false);
      setSaveMessage("Project details saved.");
    } catch {
      setSaveMessage("Failed to save project details.");
    } finally {
      setDetailsSaving(false);
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
        <Button asChild className="mt-4" size="sm">
          <Link to={projectsListPath}>Back to projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <PageShell className="max-w-6xl mx-auto">
      <Link
        to={projectsListPath}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      <PageTitle
        title={project.projectName}
        subtitle={`${project.id} · ${project.clientName} · ${project.location}`}
        actions={
          isFinance ? (
            <StatusBadge status={project.status} />
          ) : (
            <StatusSelect
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={saving}
            />
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {!isFinance && (
          <>
            <Button asChild size="sm" variant="outline">
              <Link to={drawingsPath}>
                <FileImage className="w-4 h-4 mr-1" /> Drawings
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={schedulePath}>
                <GanttChart className="w-4 h-4 mr-1" /> Schedule
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={approvalsPath}>
                <Stamp className="w-4 h-4 mr-1" /> Approvals
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
              <Link to={subcontractorsPath} state={PROJECT_DETAIL_NAV_STATE}>
                <HardHat className="w-4 h-4 mr-1" /> Subcontractors
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={validationPath} state={PROJECT_DETAIL_NAV_STATE}>
                <ClipboardCheck className="w-4 h-4 mr-1" /> Validation
              </Link>
            </Button>
          </>
        )}
        <Button asChild size="sm" variant={isFinance ? "default" : "outline"}>
          <Link to={billingPath || ROUTES.FINANCE.PROJECT_BILLING.replace(":projectId", projectId)}>
            <CreditCard className="w-4 h-4 mr-1" /> Billing
          </Link>
        </Button>
      </div>

      {saveMessage && (
        <p className="text-sm text-muted-foreground">{saveMessage}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Contract Value"
          value={formatAed(project.budget || 0)}
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
        <CardContent className="p-5 pt-5 md:p-6 md:pt-6">
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

      {!isFinance && (
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
      )}

      {/* BOQ documents */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            BOQ
          </CardTitle>
          {!isPm && !isFinance && !boqFrozen && (
            <Button asChild size="sm" variant="outline">
              <Link to={`${ROUTES.ADMIN.QAS}?projectId=${projectId}`}>New survey BOQ</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {boqsLoading ? (
            <p className="text-sm text-muted-foreground">Loading BOQs…</p>
          ) : boqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No BOQs saved for this project yet.</p>
          ) : (
            <div className="space-y-4">
              {liveBoq && (
                <div className="rounded-lg border px-3 py-3 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold">v{liveBoq.version}</span>
                        <BoqStatusBadge status={liveBoq.status} />
                        {liveBoq.revisionLabel && (
                          <span className="text-xs text-muted-foreground">{liveBoq.revisionLabel}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {liveBoq.lines?.length || 0} lines · Updated {liveBoq.updatedAt ? new Date(liveBoq.updatedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold tabular-nums text-sm">{formatCurrency(liveBoq.grandTotal)}</span>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={boqViewPath(role, liveBoq.id, projectId)}>Open</Link>
                      </Button>
                    </div>
                  </div>
                  <BoqApprovalPipeline status={liveBoq.status} />
                  {boqFrozen && (
                    <p className="text-xs text-emerald-700">
                      Client-approved and locked. This is the live BOQ for the project.
                    </p>
                  )}
                </div>
              )}
              {boqHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Previous versions</p>
                  {boqHistory.map((boq) => (
                    <div
                      key={boq.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold">v{boq.version}</span>
                          <BoqStatusBadge status={boq.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {boq.updatedAt ? new Date(boq.updatedAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold tabular-nums text-sm">{formatCurrency(boq.grandTotal)}</span>
                        <Button asChild size="sm" variant="ghost">
                          <Link to={boqViewPath(role, boq.id, projectId)}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectApprovalsSection href={approvalsPath} projectId={projectId} />

      {!isFinance && (
        <ProjectRoomsSection projectId={projectId} projectName={project.projectName || project.name} />
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project scope */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              Project Details
            </CardTitle>
            {!isFinance && (
              <Button size="sm" variant="outline" onClick={openDetailsEdit}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            <Separator />
            <div className="grid gap-x-6 sm:grid-cols-2">
              <div>
                <InfoItem label="Project ID"     value={project.id} mono />
                {project.leadReferenceNo ? (
                  <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
                    <span className="w-36 shrink-0 text-xs text-muted-foreground">Lead Ref</span>
                    {project.leadId && !isFinance ? (
                      <Link
                        to={ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", project.leadId)}
                        className="text-sm font-medium font-mono text-xs text-primary hover:underline"
                      >
                        {project.leadReferenceNo}
                      </Link>
                    ) : project.leadId ? (
                      <span className="text-sm font-medium font-mono text-xs">{project.leadReferenceNo}</span>
                    ) : (
                      <span className="text-sm font-medium font-mono text-xs">{project.leadReferenceNo}</span>
                    )}
                  </div>
                ) : (
                  <InfoItem label="Lead Ref" value="—" mono />
                )}
                <InfoItem label="Project Type"   value={project.projectType} />
                <InfoItem label="Project nature" value={natureName} />
                <InfoItem label="Location"       value={project.location} />
                <ProjectDeveloperInfo jurisdictionPackId={project.jurisdictionPackId} variant="infoItem" />
                <InfoItem label="Start Date"     value={project.startDate} />
                <InfoItem label="Target Date"    value={project.expectedCompletionDate} />
              </div>
              <div>
                <InfoItem label="Status"         value={project.status} />
                <InfoItem label="Manager"        value={managerDisplay} />
                <InfoItem label="Budget"         value={formatAed(project.budget)} />
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
                  { label: "Total",       value: formatAed(project.budget),                     c: "text-foreground" },
                  { label: "Paid",        value: formatAed(Math.round(project.budget * 0.45)),   c: "text-emerald-600" },
                  { label: "Outstanding", value: formatAed(Math.round(project.budget * 0.55)),   c: "text-amber-600" },
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

      {!isFinance && (
        <ProjectTeamAssignmentSection projectId={projectId} onSaved={handleTeamSaved} />
      )}

      {labourCrews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <HardHat className="h-4 w-4 text-primary" />
              Labour Crews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {labourCrews.map((crew) => (
                <div key={crew.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {(crew.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{crew.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Resource plan</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project type</Label>
              <Select
                value={detailsForm.projectType || undefined}
                onValueChange={(value) => setDetailsField("projectType", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project nature</Label>
              <Select
                value={detailsForm.approvalProjectNatureId || NATURE_NONE}
                onValueChange={(value) => setDetailsField("approvalProjectNatureId", value === NATURE_NONE ? "" : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Not set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NATURE_NONE}>Not set</SelectItem>
                  {projectNatures.filter((item) => item.active !== false).map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Developer</Label>
              <Select
                value={detailsForm.jurisdictionPackId || undefined}
                onValueChange={(value) => setDetailsField("jurisdictionPackId", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select developer, community or zone" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictionPacks.length === 0 ? (
                    <SelectItem value="__none" disabled>No packs available</SelectItem>
                  ) : (
                    jurisdictionPacks.map((pack) => (
                      <SelectItem key={pack.id} value={String(pack.id)}>{pack.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Start date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                <Input
                  type="date"
                  className="h-9 pl-9"
                  value={detailsForm.startDate}
                  onChange={(e) => setDetailsField("startDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
                <Input
                  type="date"
                  className="h-9 pl-9"
                  value={detailsForm.expectedCompletionDate}
                  onChange={(e) => setDetailsField("expectedCompletionDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Manager</Label>
              <Select
                value={detailsForm.assignedManager || undefined}
                onValueChange={(value) => setDetailsField("assignedManager", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select project manager" />
                </SelectTrigger>
                <SelectContent>
                  {managerOptions.length === 0 ? (
                    <SelectItem value="__none__" disabled>No employees available</SelectItem>
                  ) : (
                    managerOptions.map((emp) => (
                      <SelectItem key={emp.id} value={emp.employeeName}>
                        {emp.employeeName}
                        {emp.designation ? ` · ${emp.designation}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Client</Label>
              <Select
                value={detailsForm.clientId || undefined}
                onValueChange={(value) => setDetailsField("clientId", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="__none" disabled>No clients found</SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.fullName} ({client.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDetailsOpen(false)} disabled={detailsSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveDetails} disabled={detailsSaving}>
              {detailsSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
