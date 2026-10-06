import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router-dom";
import { Download, Eye, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, StatTile } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { rememberProjectName } from "../../hooks/useProjectName";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchResourceTypes,
  createResourceType,
  fetchResourceAssignments,
  createResourceAssignment,
  deleteResourceAssignment,
  fetchPlantToolUtilisation,
} from "../../api/resource.api";
import { fetchProjectSchedule } from "../../api/schedule.api";
import { fetchProjectById } from "../../api/projects.api";
import { projectPlanningBackPath } from "@/shared/constants/routes";
import { notify } from "@/lib/notify";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import UtilisationReportTemplate from "./UtilisationReportTemplate";
import PlanAreaReadyActions from "./PlanAreaReadyActions";
import PlanningHubSkeleton from "./PlanningHubSkeleton";
import {
  buildResourceUtilisationRows,
  downloadUtilisationReportPdf,
  previewUtilisationReportPdf,
} from "./utilisationReportPdf";

const RESOURCE_UTILISATION_PRINT_ID = "resource-utilisation-print";
const PLANT_TOOL_KINDS = ["PLANT", "TOOL"];

function activityLabel(a) {
  if (!a) return "Activity";
  const name = a.name || a.title || "Untitled activity";
  const start = a.plannedStart || a.startDate || a.start || "";
  const end = a.plannedEnd || a.endDate || a.end || "";
  const range = start && end ? ` · ${String(start).slice(0, 10)} → ${String(end).slice(0, 10)}` : "";
  return `${name}${range}`;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

/** Earliest start / latest end for a resource type from assignment logs. */
function resourceDateSpan(assignments, resourceTypeUuid) {
  let start = null;
  let end = null;
  for (const a of assignments || []) {
    if (String(a.resourceTypeUuid) !== String(resourceTypeUuid)) continue;
    const s = formatDate(a.startDate);
    const e = formatDate(a.endDate);
    if (s !== "—" && (!start || s < start)) start = s;
    if (e !== "—" && (!end || e > end)) end = e;
  }
  return { start: start || "—", end: end || "—" };
}

export default function ResourcePlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const hubCtx = useOutletContext();
  const inHub = !!hubCtx?.inPlanningHub;
  const { archived } = useProjectLifecycle(projectId);
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [types, setTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [utilisation, setUtilisation] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [typeForm, setTypeForm] = useState({ name: "", kind: "TOOL" });
  const [assignForm, setAssignForm] = useState({
    activityUuid: "",
    resourceTypeUuid: "",
    quantity: 1,
    startDate: "",
    endDate: "",
  });

  const displayProjectName = projectName || "Project";

  const activeTypes = useMemo(
    () => (Array.isArray(types) ? types.filter((t) => t.active !== false) : []),
    [types]
  );

  const activityByUuid = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (a?.uuid) map.set(String(a.uuid), a);
    }
    return map;
  }, [activities]);

  const typeByUuid = useMemo(() => {
    const map = new Map();
    for (const t of types) {
      if (t?.uuid) map.set(String(t.uuid), t);
    }
    return map;
  }, [types]);

  const utilisationRows = useMemo(
    () => buildResourceUtilisationRows(assignments, activityByUuid, typeByUuid),
    [assignments, activityByUuid, typeByUuid]
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      Promise.all([
        fetchResourceTypes("PLANT").catch(() => []),
        fetchResourceTypes("TOOL").catch(() => []),
      ]).then(([plant, tool]) => [...(Array.isArray(plant) ? plant : []), ...(Array.isArray(tool) ? tool : [])]),
      fetchResourceAssignments(projectId).catch(() => []),
      fetchPlantToolUtilisation(projectId).catch(() => null),
      fetchProjectSchedule(projectId).catch(() => null),
      fetchProjectById(projectId).catch(() => null),
    ])
      .then(([t, a, u, schedule, project]) => {
        setTypes(Array.isArray(t) ? t : []);
        setAssignments(Array.isArray(a) ? a : []);
        setUtilisation(u);
        const acts = Array.isArray(schedule?.activities) ? schedule.activities : [];
        setActivities(acts);
        setProjectName(project?.projectName || project?.name || "");
        rememberProjectName(projectId, project?.projectName || project?.name);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) notify.success(okMsg);
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || "Request failed";
      setMessage(errMsg);
      notify.error(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateType = () =>
    run(
      () =>
        createResourceType({
          name: typeForm.name.trim(),
          kind: typeForm.kind,
          active: true,
        }),
      "Resource type created"
    );

  const handleAssign = () =>
    run(
      () =>
        createResourceAssignment(projectId, {
          activityUuid: assignForm.activityUuid.trim(),
          resourceTypeUuid: assignForm.resourceTypeUuid,
          quantity: Number(assignForm.quantity) || 1,
          startDate: assignForm.startDate,
          endDate: assignForm.endDate,
        }),
      "Resource assigned"
    );

  const runPdf = async (fn) => {
    setPdfBusy(true);
    try {
      await fn();
    } catch (e) {
      notify.error(e?.message || "PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    if (inHub) {
      return <PlanningHubSkeleton />;
    }
    return (
      <PageShell>
        <PlanningHubSkeleton />
      </PageShell>
    );
  }

  const Shell = inHub ? "div" : PageShell;
  const Frame = inHub ? "div" : ProjectPageFrame;
  const frameClass = inHub ? "space-y-6" : undefined;

  return (
    <Shell>
      <Frame className={frameClass}>
      {!inHub && (
        <>
          <ProjectPathLine
            projectId={projectId}
            initialName={projectName}
            backTo={backPath}
            backTitle={`Back to ${backLabel}`}
          />
          <PageHeader
            title="Resource Plan"
            subtitle={`Plant & tools · ${displayProjectName}`}
            actions={
              <PlanAreaReadyActions
                projectId={projectId}
                statusKey="resourceStatus"
                archived={archived}
              />
            }
          />
        </>
      )}
      {inHub && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Resource plan</p>
          <PlanAreaReadyActions
            projectId={projectId}
            statusKey="resourceStatus"
            archived={archived}
          />
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Plant & tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Name</Label>
                <Input
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Scaffold tower"
                />
              </div>
              <div className="space-y-1 w-28">
                <Label className="text-xs">Kind</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={typeForm.kind}
                  onChange={(e) => setTypeForm((f) => ({ ...f, kind: e.target.value }))}
                >
                  {PLANT_TOOL_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={handleCreateType} disabled={busy || !typeForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="divide-y divide-border/40">
              {types.map((t) => (
                <div key={t.uuid} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.kind}</p>
                  </div>
                  <Badge variant={t.active ? "secondary" : "outline"}>
                    {t.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {!types.length && (
                <p className="text-sm text-muted-foreground py-4 text-center">No plant or tools yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Utilisation</CardTitle>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 md:min-h-9"
                disabled={pdfBusy || assignments.length === 0}
                onClick={() => runPdf(() => previewUtilisationReportPdf(RESOURCE_UTILISATION_PRINT_ID))}
              >
                <Eye className="mr-1 h-4 w-4" /> Preview
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 md:min-h-9"
                disabled={pdfBusy || assignments.length === 0}
                onClick={() =>
                  runPdf(() =>
                    downloadUtilisationReportPdf(
                      RESOURCE_UTILISATION_PRINT_ID,
                      `Resource-Utilisation-Project-${projectId}.pdf`
                    )
                  )
                }
              >
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {utilisation ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <StatTile label="Resource-days" value={utilisation.totalResourceDays ?? 0} />
                  <StatTile label="Assignments" value={utilisation.assignmentCount ?? 0} />
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[420px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Resource</TableHead>
                        <TableHead className="text-xs">Kind</TableHead>
                        <TableHead className="text-xs">Start</TableHead>
                        <TableHead className="text-xs">End</TableHead>
                        <TableHead className="text-xs text-right">Total days</TableHead>
                        <TableHead className="text-xs text-right">Assignments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(utilisation.resources || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                            No utilisation data
                          </TableCell>
                        </TableRow>
                      ) : (
                        (utilisation.resources || []).map((r) => {
                          const span = resourceDateSpan(assignments, r.resourceTypeUuid);
                          return (
                            <TableRow key={r.resourceTypeUuid}>
                              <TableCell className="text-sm font-medium">{r.resourceTypeName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {r.kind || "—"}
                              </TableCell>
                              <TableCell className="text-sm tabular-nums text-muted-foreground">
                                {span.start}
                              </TableCell>
                              <TableCell className="text-sm tabular-nums text-muted-foreground">
                                {span.end}
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {r.quantityDays ?? r.assignedDays ?? 0}
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {r.assignmentCount ?? 0}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No utilisation data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign resource to activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs">Schedule activity</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.activityUuid}
                onChange={(e) => {
                  const uuid = e.target.value;
                  const act = activityByUuid.get(uuid);
                  const start = act?.plannedStart || act?.startDate || act?.start || "";
                  const end = act?.plannedEnd || act?.endDate || act?.end || "";
                  setAssignForm((f) => ({
                    ...f,
                    activityUuid: uuid,
                    startDate: f.startDate || (start ? String(start).slice(0, 10) : ""),
                    endDate: f.endDate || (end ? String(end).slice(0, 10) : ""),
                  }));
                }}
              >
                <option value="">
                  {activities.length ? "Select activity" : "No schedule activities — create them on Schedule first"}
                </option>
                {activities.map((a) => (
                  <option key={a.uuid} value={a.uuid}>{activityLabel(a)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resource</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.resourceTypeUuid}
                onChange={(e) => setAssignForm((f) => ({ ...f, resourceTypeUuid: e.target.value }))}
              >
                <option value="">Select plant/tool</option>
                {activeTypes.map((t) => (
                  <option key={t.uuid} value={t.uuid}>{t.name} ({t.kind})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                min={1}
                value={assignForm.quantity}
                onChange={(e) => setAssignForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input
                type="date"
                value={assignForm.startDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input
                type="date"
                value={assignForm.endDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={
              busy
              || !assignForm.activityUuid
              || !assignForm.resourceTypeUuid
              || !assignForm.startDate
              || !assignForm.endDate
            }
          >
            Assign
          </Button>

          <div className="divide-y divide-border/40">
            {assignments.map((a) => {
              const act = activityByUuid.get(String(a.activityUuid || ""));
              return (
              <div key={a.uuid} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.resourceTypeName || a.resourceTypeUuid}
                    {a.kind ? ` · ${a.kind}` : ""}
                    {a.quantity > 1 ? ` ×${a.quantity}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {act ? activityLabel(act) : "Activity"} · {a.startDate} → {a.endDate}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  disabled={busy}
                  onClick={() => run(() => deleteResourceAssignment(projectId, a.uuid), "Assignment removed")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              );
            })}
            {!assignments.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">No assignments yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "794px",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <UtilisationReportTemplate
          elementId={RESOURCE_UTILISATION_PRINT_ID}
          variant="resource"
          projectId={projectId}
          projectName={displayProjectName}
          reportDate={new Date().toISOString()}
          rows={utilisationRows}
          totalDays={utilisation?.totalResourceDays ?? 0}
          assignmentCount={utilisation?.assignmentCount ?? assignments.length}
        />
      </div>
      </Frame>
    </Shell>
  );
}
