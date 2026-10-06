import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  DollarSign, CalendarDays, Clock, Calendar, Pencil,
  TrendingUp, Building2, Briefcase, MapPin, FileImage, FileText, GanttChart,
  AlertTriangle, BarChart3, CreditCard, HardHat, ClipboardCheck, ClipboardList, Stamp, GitBranch, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { rememberProjectName } from "../hooks/useProjectName";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { cn } from "@/lib/utils";
import { fetchProjectById, updateProject } from "../api/projects.api";
import { fetchAllClients } from "../api/clients.api";
import { fetchAllEmployees } from "../api/employees.api";
import { fetchCrewAssignments } from "../api/resource.api";
import { fetchProjectTeamAssignments } from "../api/project-team.api";
import { fetchBoqsByProject } from "../api/boq.api";
import { fetchProjectCommercial } from "../api/variations.api";
import { fetchProjectSchedule } from "../api/schedule.api";
import { fetchCompanySummary } from "../api/billing.api";
import { fetchProgressReport } from "../api/reporting.api";
import { ROUTES, PROJECT_DETAIL_NAV_STATE, boqViewPath, portalRoutesFromPath } from "@/shared/constants/routes";
import { useAuth } from "@/shared/context/auth-context";
import { BoqStatusBadge } from "./boq/BoqApprovalTimeline";
import { PROJECT_STATUS_LIST, PROJECT_STATUS_COLORS, isProjectArchived, isCommercialFrozen } from "../constants/project.constants";
import ProjectStatusBadge from "../components/projects/ProjectStatusBadge";
import ProjectLifecycleBanner from "../components/projects/ProjectLifecycleBanner";
import BoqApprovalPipeline from "./boq/BoqApprovalPipeline";
import { formatCurrency, formatAed } from "@/shared/utils/currency";
import { splitProjectBoqs } from "./boq/boqDataUtils";
import ProjectRoomsSection from "./roomcollab/ProjectRoomsSection";
import ProjectChatSection from "./communications/ProjectChatSection";
import FinalProjectPdfButton from "../components/projects/FinalProjectPdfButton";
import ProjectTeamAssignmentSection from "./ProjectTeamAssignmentSection";
import SiteEngineerTaskAssignSection from "./SiteEngineerTaskAssignSection";
import ProjectApprovalsSection from "./ProjectApprovalsSection";
import ProjectDeveloperInfo from "./ProjectDeveloperInfo";
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

function formatDisplayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function scheduleActivitiesFromResponse(data) {
  if (Array.isArray(data?.activities)) return data.activities;
  if (Array.isArray(data)) return data;
  return [];
}

function averageScheduleProgress(activities) {
  if (!activities?.length) return 0;
  const total = activities.reduce((sum, activity) => {
    const pct = Number(activity?.percentComplete);
    return sum + (Number.isFinite(pct) ? pct : 0);
  }, 0);
  return Math.round(total / activities.length);
}

function earliestActivityDate(activities, fields) {
  let best = null;
  for (const activity of activities || []) {
    for (const field of fields) {
      const raw = activity?.[field];
      if (!raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;
      if (!best || date < best) best = date;
    }
  }
  return best;
}

function latestActivityDate(activities, fields) {
  let best = null;
  for (const activity of activities || []) {
    for (const field of fields) {
      const raw = activity?.[field];
      if (!raw) continue;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) continue;
      if (!best || date > best) best = date;
    }
  }
  return best;
}

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function StatusSelect({ value, onValueChange, disabled }) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-8 w-auto min-w-[8.5rem] gap-1 rounded-full border-none px-3 text-xs font-medium shadow-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/30",
          PROJECT_STATUS_COLORS[value] || "bg-secondary text-foreground"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_STATUS_LIST.map((status) => (
          <SelectItem key={status} value={status}>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PROJECT_STATUS_COLORS[status])}>
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
  const isDirector = location.pathname.startsWith("/business-owner");
  const routes = portalRoutesFromPath(location.pathname);
  const projectsListPath = isFinance
    ? ROUTES.FINANCE.PROJECTS
    : isDirector
      ? ROUTES.BUSINESS_OWNER.PROJECTS
      : routes.PROJECTS;
  const drawingsPath = projectSubPath(routes, "PROJECT_DRAWINGS", projectId);
  const planningPath = projectSubPath(routes, "PROJECT_MATERIAL_PLAN", projectId);
  const schedulePath = projectSubPath(routes, "PROJECT_SCHEDULE", projectId);
  const approvalsPath = projectSubPath(routes, "PROJECT_APPROVALS", projectId);
  const snagsPath = projectSubPath(routes, "PROJECT_SNAGS", projectId);
  const variationsPath = projectSubPath(routes, "PROJECT_VARIATIONS", projectId);
  const documentsPath = projectSubPath(routes, "PROJECT_DOCUMENTS", projectId);
  const reportingPath = projectSubPath(routes, "PROJECT_REPORTING", projectId);
  const billingPath = projectSubPath(routes, "PROJECT_BILLING", projectId);
  const completionPath = projectSubPath(routes, "PROJECT_COMPLETION", projectId);
  const subcontractorsPath = projectSubPath(routes, "PROJECT_SUBCONTRACTORS", projectId);
  const validationPath = projectSubPath(routes, "PROJECT_VALIDATION", projectId);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [boqs, setBoqs] = useState([]);
  const [boqsLoading, setBoqsLoading] = useState(true);
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
  const [commercial, setCommercial] = useState(null);
  const [scheduleActivities, setScheduleActivities] = useState([]);
  const [weightedCompletionPercent, setWeightedCompletionPercent] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState({
    billedAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  });

  const load = useCallback(() => {
    setLoading(true);
    fetchProjectById(projectId)
      .then((p) => {
        setProject(p);
        rememberProjectName(projectId, p?.projectName || p?.name);
      })
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

  const loadDisplaySources = useCallback(() => {
    fetchProjectCommercial(projectId)
      .then((data) => setCommercial(data || null))
      .catch(() => setCommercial(null));
    fetchProjectSchedule(projectId)
      .then((data) => setScheduleActivities(scheduleActivitiesFromResponse(data)))
      .catch(() => setScheduleActivities([]));
    fetchProgressReport(projectId)
      .then((report) => {
        const pct = report?.weightedCompletionPercent ?? report?.completionPercent;
        setWeightedCompletionPercent(pct != null && pct !== "" ? Number(pct) : null);
      })
      .catch(() => setWeightedCompletionPercent(null));
    fetchCompanySummary()
      .then((list) => {
        const row = (Array.isArray(list) ? list : []).find(
          (item) => String(item.projectId) === String(projectId)
        );
        setPaymentSummary({
          billedAmount: Number(row?.billedAmount || 0),
          paidAmount: Number(row?.paidAmount || 0),
          outstandingAmount: Number(row?.outstandingAmount || 0),
        });
      })
      .catch(() => setPaymentSummary({ billedAmount: 0, paidAmount: 0, outstandingAmount: 0 }));
  }, [projectId]);

  useEffect(() => {
    load();
    loadBoqs();
    loadDisplaySources();
    fetchAllClients()
      .then((list) => setClients(Array.isArray(list) ? list : []))
      .catch(() => setClients([]));
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
  }, [load, loadBoqs, loadDisplaySources, projectId]);

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

  const displayMetrics = useMemo(() => {
    const contractValue =
      commercial?.currentContractValue
      || commercial?.originalContractValue
      || liveBoq?.grandTotal
      || project?.budget
      || 0;

    const projectProgress = Number(project?.progress);
    let progress;
    if (projectProgress > 0) {
      progress = projectProgress;
    } else if (weightedCompletionPercent != null && Number.isFinite(Number(weightedCompletionPercent))) {
      progress = Number(weightedCompletionPercent);
    } else {
      progress = averageScheduleProgress(scheduleActivities);
    }

    const startDate =
      project?.startDate
      || earliestActivityDate(scheduleActivities, ["startDate", "earlyStart", "baselineStart", "baselineStartDate"]);

    const expectedCompletionDate =
      project?.expectedCompletionDate
      || latestActivityDate(scheduleActivities, ["endDate", "earlyFinish", "baselineEnd", "baselineEndDate"]);

    return {
      contractValue: Number(contractValue) || 0,
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      startDate,
      expectedCompletionDate,
    };
  }, [commercial, liveBoq, project, scheduleActivities, weightedCompletionPercent]);

  const paymentCollectedPct = useMemo(() => {
    const billed = Number(paymentSummary.billedAmount) || 0;
    const paid = Number(paymentSummary.paidAmount) || 0;
    if (billed <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((paid / billed) * 100)));
  }, [paymentSummary]);

  const archived = isProjectArchived(project?.commercialStage);
  const commercialFrozen = isCommercialFrozen(project?.commercialStage);
  const commercialBoqLocked = boqFrozen || commercialFrozen;

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
        <Card>
          <CardContent className="py-8">
            <LoadingPanel size="page" messages={loadingMessages.projects} />
          </CardContent>
        </Card>
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
    <PageShell>
      <ProjectPageFrame>
      <ProjectPathLine
        projectId={projectId}
        initialName={project.projectName || project.name}
      />
      <PageTitle
        title={project.projectName}
        subtitle={[project.clientName, project.location]
          .map((v) => String(v || "").trim())
          .filter((v) => v && v !== "—")
          .join(" · ") || undefined}
        actions={
          isFinance ? (
            <ProjectStatusBadge status={project.status} />
          ) : (
            <StatusSelect
              value={project.status}
              onValueChange={handleStatusChange}
              disabled={saving || archived}
            />
          )
        }
      />

      <ProjectLifecycleBanner commercialStage={project.commercialStage} />

      <div className="flex flex-wrap items-center gap-2">
        {!isFinance && (
          <>
            {drawingsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={drawingsPath}>
                  <FileImage className="w-4 h-4 mr-1" /> Drawings
                </Link>
              </Button>
            )}
            {planningPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={planningPath} state={PROJECT_DETAIL_NAV_STATE}>
                  <ClipboardList className="w-4 h-4 mr-1" /> Planning
                </Link>
              </Button>
            )}
            {schedulePath && (
              <Button asChild size="sm" variant="outline">
                <Link to={schedulePath}>
                  <GanttChart className="w-4 h-4 mr-1" /> Schedule
                </Link>
              </Button>
            )}
            {approvalsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={approvalsPath}>
                  <Stamp className="w-4 h-4 mr-1" /> Approvals
                </Link>
              </Button>
            )}
            {snagsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={snagsPath}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Snags
                </Link>
              </Button>
            )}
            {variationsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={variationsPath}>
                  <GitBranch className="w-4 h-4 mr-1" /> Variations
                </Link>
              </Button>
            )}
            {documentsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={documentsPath}>
                  <FileText className="w-4 h-4 mr-1" /> Documents
                </Link>
              </Button>
            )}
            {reportingPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={reportingPath}>
                  <BarChart3 className="w-4 h-4 mr-1" /> Reporting
                </Link>
              </Button>
            )}
            {subcontractorsPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={subcontractorsPath} state={PROJECT_DETAIL_NAV_STATE}>
                  <HardHat className="w-4 h-4 mr-1" /> Subcontractors
                </Link>
              </Button>
            )}
            {validationPath && (
              <Button asChild size="sm" variant="outline">
                <Link to={validationPath} state={PROJECT_DETAIL_NAV_STATE}>
                  <ClipboardCheck className="w-4 h-4 mr-1" /> Validation
                </Link>
              </Button>
            )}
          </>
        )}
        <Button asChild size="sm" variant={isFinance ? "default" : "outline"}>
          <Link to={billingPath || ROUTES.FINANCE.PROJECT_BILLING.replace(":projectId", projectId)}>
            <CreditCard className="w-4 h-4 mr-1" /> Billing
          </Link>
        </Button>
        {completionPath && (
          <Button asChild size="sm" variant="outline">
            <Link to={completionPath} state={PROJECT_DETAIL_NAV_STATE}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Completion
            </Link>
          </Button>
        )}
        <FinalProjectPdfButton
          projectId={projectId}
          projectName={project.projectName || project.name}
        />
      </div>

      {saveMessage && (
        <p className="text-sm text-muted-foreground">{saveMessage}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Contract Value"
          value={formatAed(displayMetrics.contractValue)}
          icon={DollarSign}
        />
        <StatTile
          label="Overall Progress"
          value={`${displayMetrics.progress}%`}
          icon={TrendingUp}
        />
        <StatTile
          label="Start Date"
          value={formatDisplayDate(displayMetrics.startDate)}
          icon={CalendarDays}
        />
        <StatTile
          label="Target Completion"
          value={formatDisplayDate(displayMetrics.expectedCompletionDate)}
          icon={Clock}
        />
      </div>

      <Card>
        <CardContent className="p-5 pt-5 md:p-6 md:pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Execution Progress</p>
            <span className="text-sm font-bold text-primary">{displayMetrics.progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${displayMetrics.progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] tabular-nums text-muted-foreground">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* BOQ documents */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            BOQ
          </CardTitle>
          {!isPm && !isFinance && !commercialBoqLocked && (
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

      <ProjectChatSection projectId={projectId} locked={archived} />

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project scope */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              Project Details
            </CardTitle>
            {!isFinance && !archived && (
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
                  disabled={clientSaving || archived}
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
                  { label: "Total",       value: formatAed(paymentSummary.billedAmount),       c: "text-foreground" },
                  { label: "Paid",        value: formatAed(paymentSummary.paidAmount),         c: "text-emerald-600" },
                  { label: "Outstanding", value: formatAed(paymentSummary.outstandingAmount),  c: "text-amber-600" },
                ].map(({ label, value, c }) => (
                  <div key={label} className="rounded-lg bg-muted/30 p-2">
                    <p className={`text-sm font-bold ${c}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${paymentCollectedPct}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{paymentCollectedPct}% collected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isFinance && (
        <ProjectTeamAssignmentSection projectId={projectId} onSaved={handleTeamSaved} readOnly={archived} />
      )}

      {!isFinance && <SiteEngineerTaskAssignSection projectId={projectId} />}

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

      {/* Site visits summary — hidden for Finance portal */}
      {!isFinance && (
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
      )}

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
      </ProjectPageFrame>
    </PageShell>
  );
}
