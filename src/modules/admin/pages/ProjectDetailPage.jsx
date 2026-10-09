import { useState, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { STALE_TIMES } from "@/shared/api/queryClient";
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
import { PROJECT_STATUS_LIST, isProjectArchived, isCommercialFrozen } from "../constants/project.constants";
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
          "h-8 w-auto min-w-[8.5rem] gap-1 rounded-full border border-[#0a1628]/15 bg-[#0a1628] px-3 text-xs font-medium text-[#FAF7F2] shadow-none hover:bg-[#081729] hover:text-[#FAF7F2] focus-visible:ring-2 focus-visible:ring-[#C9A96E]/40"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[10rem] border-border/70 bg-card p-1 shadow-md">
        {PROJECT_STATUS_LIST.map((status) => (
          <SelectItem
            key={status}
            value={status}
            className="rounded-md text-sm focus:bg-[#0a1628]/8 focus:text-foreground data-[state=checked]:bg-[#0a1628] data-[state=checked]:text-[#FAF7F2]"
          >
            {status}
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

  const moduleNavItems = useMemo(() => {
    const items = [];
    if (!isFinance) {
      if (drawingsPath) items.push({ label: "Drawings", href: drawingsPath, icon: FileImage });
      if (planningPath) {
        items.push({
          label: "Planning",
          href: planningPath,
          icon: ClipboardList,
          state: PROJECT_DETAIL_NAV_STATE,
        });
      }
      if (schedulePath) items.push({ label: "Schedule", href: schedulePath, icon: GanttChart });
      if (approvalsPath) items.push({ label: "Approvals", href: approvalsPath, icon: Stamp });
      if (snagsPath) items.push({ label: "Snags", href: snagsPath, icon: AlertTriangle });
      if (variationsPath) items.push({ label: "Variations", href: variationsPath, icon: GitBranch });
      if (documentsPath) items.push({ label: "Documents", href: documentsPath, icon: FileText });
      if (reportingPath) items.push({ label: "Reporting", href: reportingPath, icon: BarChart3 });
      if (subcontractorsPath) {
        items.push({
          label: "Subcons",
          href: subcontractorsPath,
          icon: HardHat,
          state: PROJECT_DETAIL_NAV_STATE,
          title: "Subcontractors",
        });
      }
      if (validationPath) {
        items.push({
          label: "Validation",
          href: validationPath,
          icon: ClipboardCheck,
          state: PROJECT_DETAIL_NAV_STATE,
        });
      }
    }
    items.push({
      label: "Billing",
      href: billingPath || ROUTES.FINANCE.PROJECT_BILLING.replace(":projectId", projectId),
      icon: CreditCard,
      emphasize: isFinance,
    });
    if (completionPath) {
      items.push({
        label: "Completion",
        href: completionPath,
        icon: CheckCircle2,
        state: PROJECT_DETAIL_NAV_STATE,
      });
    }
    return items;
  }, [
    isFinance,
    projectId,
    drawingsPath,
    planningPath,
    schedulePath,
    approvalsPath,
    snagsPath,
    variationsPath,
    documentsPath,
    reportingPath,
    subcontractorsPath,
    validationPath,
    billingPath,
    completionPath,
  ]);

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [clientSaving, setClientSaving] = useState(false);
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

  const { data: project, isLoading: loading } = useQuery({
    queryKey: ["projectDetail", projectId],
    queryFn: async () => {
      const p = await fetchProjectById(projectId);
      if (p) rememberProjectName(projectId, p.projectName || p.name);
      return p || null;
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: boqs = [], isLoading: boqsLoading } = useQuery({
    queryKey: ["projectBoqs", projectId],
    queryFn: async () => {
      const list = await fetchBoqsByProject(projectId);
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: commercial = null } = useQuery({
    queryKey: ["projectCommercial", projectId],
    queryFn: () => fetchProjectCommercial(projectId).catch(() => null),
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: scheduleActivities = [] } = useQuery({
    queryKey: ["projectSchedule", projectId],
    queryFn: async () => {
      const data = await fetchProjectSchedule(projectId).catch(() => []);
      return scheduleActivitiesFromResponse(data);
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: weightedCompletionPercent = null } = useQuery({
    queryKey: ["projectProgressReport", projectId],
    queryFn: async () => {
      const report = await fetchProgressReport(projectId).catch(() => null);
      const pct = report?.weightedCompletionPercent ?? report?.completionPercent;
      return pct != null && pct !== "" ? Number(pct) : null;
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: paymentSummary = { billedAmount: 0, paidAmount: 0, outstandingAmount: 0 } } = useQuery({
    queryKey: ["projectPaymentSummary", projectId],
    queryFn: async () => {
      const list = await fetchCompanySummary().catch(() => []);
      const row = (Array.isArray(list) ? list : []).find(
        (item) => String(item.projectId) === String(projectId)
      );
      return {
        billedAmount: Number(row?.billedAmount || 0),
        paidAmount: Number(row?.paidAmount || 0),
        outstandingAmount: Number(row?.outstandingAmount || 0),
      };
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["adminClients"],
    queryFn: async () => {
      const list = await fetchAllClients().catch(() => []);
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["adminEmployees"],
    queryFn: async () => {
      const list = await fetchAllEmployees().catch(() => []);
      return Array.isArray(list) ? list.filter((e) => e.isActive !== false) : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: crewAssignments = [] } = useQuery({
    queryKey: ["projectCrewAssignments", projectId],
    queryFn: async () => {
      const list = await fetchCrewAssignments(projectId).catch(() => []);
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: teamAssignments = [] } = useQuery({
    queryKey: ["projectTeamAssignments", projectId],
    queryFn: () => fetchProjectTeamAssignments(projectId).catch(() => []),
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: jurisdictionPacks = [] } = useQuery({
    queryKey: ["jurisdictionPacks"],
    queryFn: async () => {
      const list = await fetchJurisdictionPacks(true).catch(() => []);
      return Array.isArray(list) ? list : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

  const { data: projectNatures = [] } = useQuery({
    queryKey: ["approvalsCatalogNatures"],
    queryFn: async () => {
      const catalog = await fetchApprovalsCatalog().catch(() => null);
      return Array.isArray(catalog?.projectNatures) ? catalog.projectNatures : [];
    },
    staleTime: STALE_TIMES.STATIC,
  });

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
    queryClient.invalidateQueries({ queryKey: ["projectTeamAssignments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projectDetail", projectId] });
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    setSaveMessage("");
    try {
      await updateProject(projectId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["projectDetail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      setSaveMessage("Status saved.");
    } catch {
      setSaveMessage("Failed to save status.");
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = async (clientId) => {
    setClientSaving(true);
    setSaveMessage("");
    try {
      await updateProject(projectId, { clientId: Number(clientId) });
      queryClient.invalidateQueries({ queryKey: ["projectDetail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      setSaveMessage("Client assigned.");
    } catch {
      setSaveMessage("Failed to assign client.");
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
      await updateProject(projectId, {
        projectType: detailsForm.projectType,
        approvalProjectNatureId: detailsForm.approvalProjectNatureId || undefined,
        jurisdictionPackId: detailsForm.jurisdictionPackId || undefined,
        startDate: detailsForm.startDate || null,
        expectedCompletionDate: detailsForm.expectedCompletionDate || null,
        assignedManager: detailsForm.assignedManager || undefined,
        clientId: detailsForm.clientId ? Number(detailsForm.clientId) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["projectDetail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
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

        <nav
          aria-label="Project modules"
          className="mt-2 rounded-sm border border-border bg-card p-1.5 shadow-sm sm:p-2"
        >
          <div
            className="grid w-full gap-0.5 sm:gap-1"
            style={{
              gridTemplateColumns: `repeat(${moduleNavItems.length + 1}, minmax(0, 1fr))`,
            }}
          >
            {moduleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  state={item.state}
                  title={item.title || item.label}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 py-2 text-center transition-colors sm:gap-1 sm:px-1 sm:py-2.5",
                    item.emphasize
                      ? "bg-[#0a1628] text-[#FAF7F2] hover:bg-[#C9A96E] hover:text-[#0a1628]"
                      : "text-muted-foreground hover:bg-[#C9A96E]/18 hover:text-[#8a6d3b]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.75} />
                  <span className="w-full truncate text-[9px] font-semibold leading-tight tracking-wide sm:text-[10px]">
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <div className="flex min-w-0 items-stretch">
              <FinalProjectPdfButton
                projectId={projectId}
                projectName={project.projectName || project.name}
                variant="ghost"
                size="sm"
                label="Final PDF"
                className="flex w-full [&_button]:flex [&_button]:h-full [&_button]:min-h-[3.25rem] [&_button]:w-full [&_button]:flex-col [&_button]:items-center [&_button]:justify-center [&_button]:gap-0.5 [&_button]:rounded-sm [&_button]:px-0.5 [&_button]:py-2 [&_button]:text-[9px] [&_button]:font-semibold [&_button]:leading-tight [&_button]:text-muted-foreground [&_button]:hover:bg-[#C9A96E]/18 [&_button]:hover:text-[#8a6d3b] sm:[&_button]:gap-1 sm:[&_button]:text-[10px] [&_svg]:mb-0 [&_svg]:mr-0 [&_svg]:h-3.5 [&_svg]:w-3.5 sm:[&_svg]:h-4 sm:[&_svg]:w-4"
              />
            </div>
          </div>
        </nav>

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
          <CardContent className="p-4 pt-6 md:p-6 md:pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Execution Progress</p>
              <span className="text-sm font-bold text-primary">{displayMetrics.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-lg bg-muted">
              <div
                className="h-full rounded-lg bg-primary transition-all duration-700"
                style={{ width: `${displayMetrics.progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[12px] tabular-nums text-muted-foreground">
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
                  <InfoItem label="Project ID" value={project.id} mono />
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
                  <InfoItem label="Project Type" value={project.projectType} />
                  <InfoItem label="Project nature" value={natureName} />
                  <InfoItem label="Location" value={project.location} />
                  <ProjectDeveloperInfo jurisdictionPackId={project.jurisdictionPackId} variant="infoItem" />
                  <InfoItem label="Start Date" value={project.startDate} />
                  <InfoItem label="Target Date" value={project.expectedCompletionDate} />
                </div>
                <div>
                  <InfoItem label="Status" value={project.status} />
                  <InfoItem label="Manager" value={managerDisplay} />
                  <InfoItem label="Budget" value={formatAed(project.budget)} />
                  <InfoItem label="Client" value={project.clientName} />
                  <InfoItem label="Progress" value={`${project.progress}%`} />
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
                <InfoItem label="Client ID" value={project.clientId || "—"} mono />
                <InfoItem label="Location" value={project.location} />
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
                    { label: "Total", value: formatAed(paymentSummary.billedAmount), c: "text-foreground" },
                    { label: "Paid", value: formatAed(paymentSummary.paidAmount), c: "text-emerald-600" },
                    { label: "Outstanding", value: formatAed(paymentSummary.outstandingAmount), c: "text-amber-600" },
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
                  { label: "Total", value: 0, c: "text-foreground" },
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
