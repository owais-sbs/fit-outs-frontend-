import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext, useParams } from "react-router-dom";
import { Download, Eye, Plus, Trash2, Users } from "lucide-react";
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
  fetchLabourCrews,
  createLabourCrew,
  fetchCrewAssignments,
  createCrewAssignment,
  deleteCrewAssignment,
  fetchResourceUtilisation,
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
  buildLabourUtilisationRows,
  downloadUtilisationReportPdf,
  previewUtilisationReportPdf,
} from "./utilisationReportPdf";

const LABOUR_UTILISATION_PRINT_ID = "labour-utilisation-print";

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

/** Earliest start / latest end for a crew from assignment logs. */
function crewDateSpan(assignments, crewUuid) {
  let start = null;
  let end = null;
  for (const a of assignments || []) {
    if (String(a.crewUuid) !== String(crewUuid)) continue;
    const s = formatDate(a.startDate);
    const e = formatDate(a.endDate);
    if (s !== "—" && (!start || s < start)) start = s;
    if (e !== "—" && (!end || e > end)) end = e;
  }
  return { start: start || "—", end: end || "—" };
}

export default function LabourPlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const hubCtx = useOutletContext();
  const inHub = !!hubCtx?.inPlanningHub;
  const { archived } = useProjectLifecycle(projectId);
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [crews, setCrews] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [utilisation, setUtilisation] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [crewForm, setCrewForm] = useState({ name: "", headcount: 4 });
  const [assignForm, setAssignForm] = useState({
    activityUuid: "",
    crewUuid: "",
    startDate: "",
    endDate: "",
  });

  const displayProjectName = projectName || "Project";

  const activityByUuid = useMemo(() => {
    const map = new Map();
    for (const a of activities) {
      if (a?.uuid) map.set(String(a.uuid), a);
    }
    return map;
  }, [activities]);

  const crewByUuid = useMemo(() => {
    const map = new Map();
    for (const c of crews) {
      if (c?.uuid) map.set(String(c.uuid), c);
    }
    return map;
  }, [crews]);

  const utilisationRows = useMemo(
    () => buildLabourUtilisationRows(assignments, activityByUuid, crewByUuid),
    [assignments, activityByUuid, crewByUuid]
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchLabourCrews().catch(() => []),
      fetchCrewAssignments(projectId).catch(() => []),
      fetchResourceUtilisation(projectId).catch(() => null),
      fetchProjectSchedule(projectId).catch(() => null),
      fetchProjectById(projectId).catch(() => null),
    ])
      .then(([c, a, u, schedule, project]) => {
        setCrews(Array.isArray(c) ? c : []);
        setAssignments(Array.isArray(a) ? a : []);
        setUtilisation(u);
        setActivities(Array.isArray(schedule?.activities) ? schedule.activities : []);
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

  const handleCreateCrew = () =>
    run(
      () =>
        createLabourCrew({
          name: crewForm.name.trim(),
          headcount: Number(crewForm.headcount) || 1,
          active: true,
        }),
      "Crew created"
    );

  const handleAssign = () =>
    run(
      () =>
        createCrewAssignment(projectId, {
          activityUuid: assignForm.activityUuid.trim(),
          crewUuid: assignForm.crewUuid,
          startDate: assignForm.startDate,
          endDate: assignForm.endDate,
        }),
      "Crew assigned"
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
            title="Labour Plan"
            subtitle={displayProjectName}
            actions={
              <PlanAreaReadyActions
                projectId={projectId}
                statusKey="labourStatus"
                archived={archived}
              />
            }
          />
        </>
      )}
      {inHub && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Labour plan</p>
          <PlanAreaReadyActions
            projectId={projectId}
            statusKey="labourStatus"
            archived={archived}
          />
        </div>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Labour crews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <Label className="text-xs">Name</Label>
                <Input
                  value={crewForm.name}
                  onChange={(e) => setCrewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Crew A"
                />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Headcount</Label>
                <Input
                  type="number"
                  min={1}
                  value={crewForm.headcount}
                  onChange={(e) => setCrewForm((f) => ({ ...f, headcount: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={handleCreateCrew} disabled={busy || !crewForm.name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="divide-y divide-border/40">
              {crews.map((c) => (
                <div key={c.uuid} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.headcount} people</p>
                  </div>
                  <Badge variant={c.active ? "secondary" : "outline"}>
                    {c.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {!crews.length && (
                <p className="text-sm text-muted-foreground py-4 text-center">No crews yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm font-semibold">Utilisation</CardTitle>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 md:min-h-9"
                disabled={pdfBusy || assignments.length === 0}
                onClick={() => runPdf(() => previewUtilisationReportPdf(LABOUR_UTILISATION_PRINT_ID))}
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
                      LABOUR_UTILISATION_PRINT_ID,
                      `Labour-Utilisation-Project-${projectId}.pdf`
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
                  <StatTile label="Crew-days" value={utilisation.totalCrewDays ?? 0} />
                  <StatTile label="Assignments" value={utilisation.assignmentCount ?? 0} />
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[420px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Crew</TableHead>
                        <TableHead className="text-xs text-right">Headcount</TableHead>
                        <TableHead className="text-xs">Start</TableHead>
                        <TableHead className="text-xs">End</TableHead>
                        <TableHead className="text-xs text-right">Total days</TableHead>
                        <TableHead className="text-xs text-right">Assignments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(utilisation.crews || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                            No utilisation data
                          </TableCell>
                        </TableRow>
                      ) : (
                        (utilisation.crews || []).map((c) => {
                          const span = crewDateSpan(assignments, c.crewUuid);
                          return (
                            <TableRow key={c.crewUuid}>
                              <TableCell className="text-sm font-medium">{c.crewName}</TableCell>
                              <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                                {c.headcount ?? 0}
                              </TableCell>
                              <TableCell className="text-sm tabular-nums text-muted-foreground">
                                {span.start}
                              </TableCell>
                              <TableCell className="text-sm tabular-nums text-muted-foreground">
                                {span.end}
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {c.assignedDays ?? 0}
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {c.assignmentCount ?? 0}
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

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Assign crew to activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
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
              <Label className="text-xs">Crew</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={assignForm.crewUuid}
                onChange={(e) => setAssignForm((f) => ({ ...f, crewUuid: e.target.value }))}
              >
                <option value="">Select crew</option>
                {crews.map((c) => (
                  <option key={c.uuid} value={c.uuid}>{c.name}</option>
                ))}
              </select>
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
            disabled={busy || !assignForm.activityUuid || !assignForm.crewUuid || !assignForm.startDate || !assignForm.endDate}
          >
            Assign
          </Button>

          <div className="divide-y divide-border/40">
            {assignments.map((a) => {
              const act = activityByUuid.get(String(a.activityUuid || ""));
              return (
              <div key={a.uuid} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.crewName || a.crewUuid}</p>
                  <p className="text-xs text-muted-foreground">
                    {act ? activityLabel(act) : "Activity"} · {a.startDate} → {a.endDate}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  disabled={busy}
                  onClick={() => run(() => deleteCrewAssignment(projectId, a.uuid), "Assignment removed")}
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
          elementId={LABOUR_UTILISATION_PRINT_ID}
          variant="labour"
          projectId={projectId}
          projectName={displayProjectName}
          reportDate={new Date().toISOString()}
          rows={utilisationRows}
          totalDays={utilisation?.totalCrewDays ?? 0}
          assignmentCount={utilisation?.assignmentCount ?? assignments.length}
        />
      </div>
      </Frame>
    </Shell>
  );
}
