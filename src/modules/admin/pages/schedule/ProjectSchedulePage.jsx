import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Plus, Trash2, Upload, Camera, Save, Wand2, Truck, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import {
  fetchProjectSchedule,
  createScheduleActivity,
  createScheduleActivityFromRoomTask,
  updateScheduleActivity,
  deleteScheduleActivity,
  addScheduleDependency,
  deleteScheduleDependency,
  publishSchedule,
  createScheduleBaseline,
  fetchScheduleBaseline,
  postActivityProgress,
  fetchActivityProgress,
  fetchOrderByDates,
  rescheduleProject,
} from "../../api/schedule.api";
import { fetchProjectRooms, fetchProjectRoomTasks } from "../../api/room-collab.api";
import { fetchAllEmployees } from "../../api/employees.api";
import ScheduleReadinessStrip from "./ScheduleReadinessStrip";
import ScheduleActivityList from "./ScheduleActivityList";
import BaselineVarianceTable from "./BaselineVarianceTable";
import CpmGantt from "./CpmGantt";
import ScheduleApplyWizard from "./ScheduleApplyWizard";
import { ROUTES } from "@/shared/constants/routes";
import { Switch } from "@/components/ui/switch";

const DAY_MS = 86400000;

/** Maps a server preview into the shape CpmGantt expects (synthetic UUIDs). */
function previewToGantt(preview) {
  if (!preview?.activities?.length) return { activities: [], dependencies: [] };
  const codeToUuid = new Map();
  const activities = preview.activities.map((a) => {
    const uuid = `preview-${a.activityCode}`;
    codeToUuid.set(a.activityCode, uuid);
    return {
      uuid,
      activityCode: a.activityCode,
      name: a.name,
      startDate: a.earlyStart,
      endDate: a.earlyFinish,
      percentComplete: 0,
      critical: a.critical,
      milestone: a.milestone,
      lockedDuration: a.lockedDuration,
      totalFloat: a.totalFloat,
      freeFloat: a.freeFloat,
      constraintNote: a.constraintNote,
      wbsPhase: a.wbsPhase,
      preview: true,
    };
  });
  const dependencies = (preview.dependencies || [])
    .map((d, i) => ({
      uuid: `preview-dep-${i}`,
      predecessorUuid: codeToUuid.get(d.predecessorCode),
      successorUuid: codeToUuid.get(d.successorCode),
      dependencyType: d.type,
      lagWorkingDays: d.lagWorkingDays,
      locked: d.locked,
    }))
    .filter((d) => d.predecessorUuid && d.successorUuid);
  return { activities, dependencies };
}

function formatDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProjectSchedulePage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);
  const roomTaskPath = (taskId) =>
    ROUTES.ADMIN.PROJECT_ROOM_TASK.replace(":projectId", projectId).replace(":taskId", taskId);

  const [schedule, setSchedule] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTasks, setRoomTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fromRoomTaskId, setFromRoomTaskId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [form, setForm] = useState({
    name: "",
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date(Date.now() + 7 * DAY_MS)),
    percentComplete: 0,
    assigneeAccountId: "",
    projectRoomId: "",
    roomTaskId: "",
  });
  const [depPred, setDepPred] = useState("");
  const [depSucc, setDepSucc] = useState("");
  const [progressForm, setProgressForm] = useState({ percentComplete: 0, notes: "", labourHours: "" });
  const [publishAllowed, setPublishAllowed] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [selectedBaselineUuid, setSelectedBaselineUuid] = useState("");
  const [baselineActivities, setBaselineActivities] = useState([]);
  const [baselineNote, setBaselineNote] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [previewGantt, setPreviewGantt] = useState(null);
  const [orderByRows, setOrderByRows] = useState([]);
  const [cpmNotes, setCpmNotes] = useState([]);

  const onPlanningChanged = useCallback((planning) => {
    setPublishAllowed(!!planning?.ganttPublishAllowed || !!planning?.planningReady);
  }, []);

  const loadBaselineActivities = useCallback(
    async (baselineUuid, scheduleData) => {
      if (!baselineUuid) {
        setBaselineActivities([]);
        setBaselineNote("");
        return;
      }
      // Prefer activities embedded on schedule response
      const embedded =
        scheduleData?.baselineActivities ||
        scheduleData?.baselines?.find((b) => String(b.uuid) === String(baselineUuid))?.activities;
      if (Array.isArray(embedded) && embedded.length) {
        setBaselineActivities(embedded);
        setBaselineNote("");
        return;
      }
      try {
        const detail = await fetchScheduleBaseline(projectId, baselineUuid);
        const acts = detail?.activities || detail?.baselineActivities || [];
        if (Array.isArray(acts) && acts.length) {
          setBaselineActivities(acts);
          setBaselineNote("");
          return;
        }
      } catch {
        /* network â€” fall through to ghost dates */
      }
      // Fallback: latest baseline snapshot fields on activities (reporting-style)
      const ghost = (scheduleData?.activities || [])
        .filter((a) => a.baselineStart || a.baselineStartDate)
        .map((a) => ({
          activityUuid: a.uuid,
          startDate: a.baselineStart || a.baselineStartDate,
          endDate: a.baselineEnd || a.baselineEndDate,
        }));
      if (ghost.length) {
        setBaselineActivities(ghost);
        setBaselineNote("Showing activity baseline dates from schedule response.");
      } else {
        setBaselineActivities([]);
        setBaselineNote("No snapshotted activities for this baseline.");
      }
    },
    [projectId]
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchProjectSchedule(projectId)
      .then(async (data) => {
        setSchedule(data);
        if (selected) {
          const refreshed = (data.activities || []).find((a) => a.uuid === selected.uuid);
          setSelected(refreshed || null);
        }
        const baselines = data?.baselines || [];
        let uuid = selectedBaselineUuid;
        if (!uuid && baselines.length) {
          uuid = baselines[0].uuid;
          setSelectedBaselineUuid(uuid);
        }
        if (uuid) await loadBaselineActivities(uuid, data);
      })
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [projectId, selected, selectedBaselineUuid, loadBaselineActivities]);

  const loadOrderBy = useCallback(() => {
    fetchOrderByDates(projectId)
      .then((rows) => setOrderByRows(Array.isArray(rows) ? rows : []))
      .catch(() => setOrderByRows([]));
  }, [projectId]);

  useEffect(() => {
    load();
    loadOrderBy();
    Promise.all([
      fetchProjectRooms(projectId).catch(() => []),
      fetchProjectRoomTasks(projectId).catch(() => []),
      fetchAllEmployees().catch(() => []),
    ]).then(([roomList, taskList, empList]) => {
      setRooms(Array.isArray(roomList) ? roomList : []);
      setRoomTasks(Array.isArray(taskList) ? taskList : []);
      setEmployees(Array.isArray(empList) ? empList : []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!selected?.uuid) {
      setProgressHistory([]);
      return;
    }
    setProgressForm({
      percentComplete: selected.percentComplete || 0,
      notes: "",
      labourHours: "",
    });
    fetchActivityProgress(selected.uuid)
      .then((list) => setProgressHistory(Array.isArray(list) ? list : []))
      .catch(() => setProgressHistory([]));
    // Reset progress form when switching activity only (uuid), not on every field tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.uuid]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await load();
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const tasksForRoom = useCallback(
    (roomId) => {
      if (!roomId) return roomTasks;
      return roomTasks.filter((t) => String(t.projectRoomId) === String(roomId));
    },
    [roomTasks]
  );

  const buildActivityPayload = (data, { isUpdate = false } = {}) => {
    const payload = {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      percentComplete: Number(data.percentComplete) || 0,
      assigneeAccountId: data.assigneeAccountId ? Number(data.assigneeAccountId) : null,
    };
    if (data.clearRoomLinks) {
      payload.clearRoomLinks = true;
    } else if (data.roomTaskId) {
      payload.roomTaskId = data.roomTaskId;
    } else if (data.projectRoomId) {
      payload.projectRoomId = data.projectRoomId;
    } else if (isUpdate && !data.projectRoomId && !data.roomTaskId) {
      payload.clearRoomLinks = true;
    }
    return payload;
  };

  const handleCreate = () =>
    run(
      () => createScheduleActivity(projectId, buildActivityPayload(form)),
      "Activity created"
    );

  const handleCreateFromRoomTask = () => {
    if (!fromRoomTaskId) return;
    run(
      () => createScheduleActivityFromRoomTask(projectId, fromRoomTaskId),
      "Activity created from room task"
    ).then(() => setFromRoomTaskId(""));
  };

  const handleUpdateSelected = () => {
    if (!selected) return;
    run(
      () =>
        updateScheduleActivity(selected.uuid, buildActivityPayload({
          name: selected.name,
          startDate: selected.startDate,
          endDate: selected.endDate,
          percentComplete: selected.percentComplete,
          assigneeAccountId: selected.assigneeAccountId || "",
          projectRoomId: selected.projectRoomId || "",
          roomTaskId: selected.roomTaskId || "",
        }, { isUpdate: true })),
      "Activity saved"
    );
  };

  const handleDeleteSelected = () => {
    if (!selected) return;
    run(() => deleteScheduleActivity(selected.uuid), "Activity deleted").then(() => setSelected(null));
  };

  const handleAddDep = () =>
    run(
      () =>
        addScheduleDependency(projectId, {
          predecessorUuid: depPred,
          successorUuid: depSucc,
        }),
      "FS dependency added"
    );

  const handleDeleteDep = (dependencyUuid) =>
    run(() => deleteScheduleDependency(dependencyUuid), "Dependency removed");

  const handlePublish = () => run(() => publishSchedule(projectId), "Schedule published");

  /**
   * A drag reports where the bar landed and the server re-solves. The engine may refuse the
   * move (a locked cure period cannot be shortened), in which case it says so and the dates
   * come back unchanged.
   */
  const handleBarMove = (activity, newStartDate) =>
    run(async () => {
      const result = await rescheduleProject(projectId, {
        activityUuid: activity.uuid,
        newStartDate,
      });
      setCpmNotes([...(result?.refusals || []), ...(result?.warnings || [])]);
      loadOrderBy();
      if (result?.finishMovedByDays) {
        setMessage(
          result.finishMovedByDays > 0
            ? `Finish date slipped ${result.finishMovedByDays} days to ${result.projectFinish}.`
            : `Finish date pulled in ${Math.abs(result.finishMovedByDays)} days to ${result.projectFinish}.`
        );
      }
    }, "Programme rescheduled");

  const handlePreviewChange = useCallback((preview) => {
    setPreviewGantt(preview ? previewToGantt(preview) : null);
  }, []);

  const handleApplied = async (result) => {
    setShowWizard(false);
    setPreviewGantt(null);
    setCpmNotes(result?.preview?.warnings || []);
    setMessage(result?.note || `Programme applied (${result?.activitiesWritten ?? 0} activities)`);
    setLoading(true);
    try {
      const data = await fetchProjectSchedule(projectId);
      setSchedule(data);
      loadOrderBy();
    } catch {
      setMessage("Programme was applied but could not be reloaded. Refresh the page.");
    } finally {
      setLoading(false);
    }
  };
  const handleBaseline = () =>
    run(() => createScheduleBaseline(projectId, `Baseline ${new Date().toLocaleString()}`), "Baseline saved");

  const handleProgress = () => {
    if (!selected) return;
    run(async () => {
      await postActivityProgress(selected.uuid, {
        percentComplete: Number(progressForm.percentComplete) || 0,
        notes: progressForm.notes || null,
        labourHours: progressForm.labourHours !== "" ? Number(progressForm.labourHours) : null,
      });
      const list = await fetchActivityProgress(selected.uuid);
      setProgressHistory(Array.isArray(list) ? list : []);
    }, "Submitted for PM validation");
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const persistedActivities = schedule?.activities || [];
  const persistedDeps = schedule?.dependencies || [];
  const usingPreview = !persistedActivities.length && previewGantt;
  const activities = usingPreview ? previewGantt.activities : persistedActivities;
  const deps = usingPreview ? previewGantt.dependencies : persistedDeps;
  const overdueOrderBys = orderByRows.filter((r) => r.overdue);

  return (
    <PageShell className="max-w-7xl mx-auto">
      <PageTitle
        title="Schedule workspace"
        subtitle="Readiness Â· Gantt Â· progress in one place"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={publishAllowed || schedule?.ganttPublishAllowed ? "bg-emerald-500/15 text-emerald-800" : "bg-amber-500/15 text-amber-800"}>
              {publishAllowed || schedule?.ganttPublishAllowed ? "Publish allowed" : "Mark planning ready"}
            </Badge>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-1">
              <Switch
                id="show-baseline"
                checked={showBaseline}
                onCheckedChange={setShowBaseline}
                disabled={!baselineActivities.length && !(schedule?.baselines || []).length}
              />
              <Label htmlFor="show-baseline" className="text-xs cursor-pointer">
                Show baseline
              </Label>
            </div>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setShowWizard((v) => !v)}>
              <Wand2 className="h-4 w-4 mr-1" /> {showWizard ? "Close wizard" : "Apply template"}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={handleBaseline}>
              <Save className="h-4 w-4 mr-1" /> Baseline
            </Button>
            <Button size="sm" disabled={busy || !(publishAllowed || schedule?.ganttPublishAllowed)} onClick={handlePublish}>
              <Upload className="h-4 w-4 mr-1" /> Publish
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to={isPm ? ROUTES.PROJECT_MANAGER.SCHEDULE_HUB : ROUTES.ADMIN.SCHEDULE_HUB}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All schedules
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to={detailPath}>Project detail</Link>
        </Button>
      </div>

      <ScheduleReadinessStrip projectId={projectId} onChanged={onPlanningChanged} />

      {showWizard && (
        <ScheduleApplyWizard
          projectId={projectId}
          onApplied={handleApplied}
          onPreviewChange={handlePreviewChange}
          onClose={() => {
            setShowWizard(false);
            setPreviewGantt(null);
          }}
        />
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {baselineNote && showBaseline && (
        <p className="text-xs text-amber-700">{baselineNote}</p>
      )}

      {!!cpmNotes.length && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> The engine has notes on this programme
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-amber-900">
            {cpmNotes.slice(0, 8).map((n) => <li key={n}>· {n}</li>)}
            {cpmNotes.length > 8 && (
              <li className="text-muted-foreground">and {cpmNotes.length - 8} more</li>
            )}
          </ul>
        </div>
      )}

      {usingPreview && (
        <p className="text-sm text-sky-800 bg-sky-500/10 rounded-lg px-4 py-2">
          Showing a <strong>preview</strong> of the computed programme. Click{" "}
          <strong>Apply and publish</strong> in the wizard above to save it to this project.
        </p>
      )}

      <ScheduleActivityList
        activities={activities}
        selectedUuid={selected?.uuid}
        onSelect={setSelected}
        roomTaskPath={roomTaskPath}
      />

      <CpmGantt
        activities={activities}
        dependencies={deps}
        onSelect={setSelected}
        selectedUuid={selected?.uuid}
        baselineActivities={baselineActivities}
        showBaseline={showBaseline}
        onBarMove={usingPreview ? undefined : handleBarMove}
        emptyMessage={
          usingPreview
            ? "Preview has no activities. Check scope toggles or recompute."
            : "No activities yet. Apply a template to generate the programme."
        }
      />

      {!!orderByRows.length && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Truck className="h-4 w-4" /> Order-by dates
            </CardTitle>
            {overdueOrderBys.length > 0 && (
              <Badge className="bg-red-500/15 text-red-800">
                {overdueOrderBys.length} already past
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2 font-semibold">Item</th>
                    <th className="px-4 py-2 font-semibold">Lead time</th>
                    <th className="px-4 py-2 font-semibold">Installs</th>
                    <th className="px-4 py-2 font-semibold">Order by</th>
                    <th className="px-4 py-2 font-semibold">Needed before ordering</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {orderByRows.map((r) => (
                    <tr key={r.uuid} className={r.overdue ? "bg-red-500/5" : ""}>
                      <td className="px-4 py-2">{r.itemName}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.leadTimeCalendarDays} calendar days
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.installActivityCode} · {r.installStartDate}
                      </td>
                      <td className={`px-4 py-2 ${r.overdue ? "font-semibold text-red-700" : ""}`}>
                        {r.orderByDate}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {r.daysToOrderBy < 0
                            ? `${Math.abs(r.daysToOrderBy)}d late`
                            : `${r.daysToOrderBy}d left`}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.siteInfoNeeded || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showBaseline && baselineActivities.length > 0 && (
        <div className="space-y-2 hidden lg:block">
          <p className="text-sm font-semibold">Baseline variance</p>
          <BaselineVarianceTable activities={activities} baselineActivities={baselineActivities} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roomTasks.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="text-xs">Create from room task</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    value={fromRoomTaskId}
                    onChange={(e) => setFromRoomTaskId(e.target.value)}
                  >
                    <option value="">Select room taskâ€¦</option>
                    {roomTasks.map((t) => (
                      <option key={t.uuid} value={t.uuid}>
                        {t.roomName ? `${t.roomName} Â· ` : ""}{t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button size="sm" variant="outline" disabled={busy || !fromRoomTaskId} onClick={handleCreateFromRoomTask}>
                  Create
                </Button>
              </div>
            )}
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Room (optional)</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={form.projectRoomId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      projectRoomId: e.target.value,
                      roomTaskId: "",
                    }))
                  }
                >
                  <option value="">None</option>
                  {rooms.map((r) => (
                    <option key={r.uuid} value={r.uuid}>
                      {r.floorLabel ? `${r.floorLabel} Â· ` : ""}{r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Room task (optional)</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={form.roomTaskId}
                  onChange={(e) => {
                    const taskId = e.target.value;
                    const task = roomTasks.find((t) => String(t.uuid) === String(taskId));
                    setForm((f) => ({
                      ...f,
                      roomTaskId: taskId,
                      projectRoomId: task?.projectRoomId || f.projectRoomId,
                    }));
                  }}
                >
                  <option value="">None</option>
                  {tasksForRoom(form.projectRoomId).map((t) => (
                    <option key={t.uuid} value={t.uuid}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">% complete</Label>
                <Input type="number" min={0} max={100} value={form.percentComplete}
                  onChange={(e) => setForm((f) => ({ ...f, percentComplete: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Assignee</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={form.assigneeAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeAccountId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.employeeName || emp.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button size="sm" disabled={busy || !form.name} onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">FS dependency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Predecessor</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={depPred} onChange={(e) => setDepPred(e.target.value)}>
                <option value="">Selectâ€¦</option>
                {activities.map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Successor</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={depSucc} onChange={(e) => setDepSucc(e.target.value)}>
                <option value="">Selectâ€¦</option>
                {activities.map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
              </select>
            </div>
            <Button size="sm" variant="outline" disabled={busy || !depPred || !depSucc} onClick={handleAddDep}>
              Link FS
            </Button>
            {deps.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1 pt-2">
                {deps.map((d) => {
                  const p = activities.find((a) => a.uuid === d.predecessorUuid)?.name || d.predecessorUuid;
                  const s = activities.find((a) => a.uuid === d.successorUuid)?.name || d.successorUuid;
                  return (
                    <li key={d.uuid} className="flex items-center justify-between gap-2">
                      <span>{p} â†’ {s} (FS)</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1 text-destructive"
                        disabled={busy}
                        onClick={() => handleDeleteDep(d.uuid)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Activity drawer â€” {selected.name}</CardTitle>
            <Button size="sm" variant="destructive" disabled={busy} onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={selected.name} onChange={(e) => setSelected((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Room</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    value={selected.projectRoomId || ""}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        projectRoomId: e.target.value || null,
                        roomTaskId: e.target.value ? s.roomTaskId : null,
                      }))
                    }
                  >
                    <option value="">None</option>
                    {rooms.map((r) => (
                      <option key={r.uuid} value={r.uuid}>
                        {r.floorLabel ? `${r.floorLabel} Â· ` : ""}{r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Room task</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    value={selected.roomTaskId || ""}
                    onChange={(e) => {
                      const taskId = e.target.value;
                      const task = roomTasks.find((t) => String(t.uuid) === String(taskId));
                      setSelected((s) => ({
                        ...s,
                        roomTaskId: taskId || null,
                        projectRoomId: task?.projectRoomId || s.projectRoomId,
                      }));
                    }}
                  >
                    <option value="">None</option>
                    {tasksForRoom(selected.projectRoomId).map((t) => (
                      <option key={t.uuid} value={t.uuid}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(selected.roomTaskId || selected.roomName || selected.roomTaskTitle) && (
                <p className="text-xs text-muted-foreground">
                  {selected.roomName || ""}
                  {selected.roomTaskTitle ? ` Â· ${selected.roomTaskTitle}` : ""}
                  {selected.roomTaskId && (
                    <>
                      {" Â· "}
                      <Link to={roomTaskPath(selected.roomTaskId)} className="text-primary underline">
                        Open room task
                      </Link>
                    </>
                  )}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Start</Label>
                  <Input type="date" value={String(selected.startDate).slice(0, 10)}
                    onChange={(e) => setSelected((s) => ({ ...s, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">End</Label>
                  <Input type="date" value={String(selected.endDate).slice(0, 10)}
                    onChange={(e) => setSelected((s) => ({ ...s, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Approved %</Label>
                  <Input type="number" min={0} max={100} value={selected.percentComplete} readOnly disabled
                    className="bg-muted/40" />
                </div>
                <div>
                  <Label className="text-xs">Assignee</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                    value={selected.assigneeAccountId || ""}
                    onChange={(e) =>
                      setSelected((s) => ({
                        ...s,
                        assigneeAccountId: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.employeeName || emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button size="sm" disabled={busy} onClick={handleUpdateSelected}>Save activity</Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1">
                <Camera className="h-4 w-4" /> Progress update
              </p>
              <p className="text-[11px] text-muted-foreground">
                Progress is applied to the schedule only after PM approval in the Validation Inbox.
              </p>
              <div>
                <Label className="text-xs">Percent</Label>
                <Input type="number" min={0} max={100} value={progressForm.percentComplete}
                  onChange={(e) => setProgressForm((f) => ({ ...f, percentComplete: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Labour hours (optional)</Label>
                <Input type="number" step="0.5" value={progressForm.labourHours}
                  onChange={(e) => setProgressForm((f) => ({ ...f, labourHours: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea rows={2} value={progressForm.notes}
                  onChange={(e) => setProgressForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button size="sm" disabled={busy} onClick={handleProgress}>Submit for validation</Button>
              {progressHistory.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-auto">
                  {progressHistory.map((u) => (
                    <li key={u.uuid} className="flex flex-wrap items-center gap-1.5">
                      <span>{u.percentComplete}% Â· {u.notes || "â€”"}</span>
                      {u.validationStatus && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {u.validationStatus}
                        </Badge>
                      )}
                      <span>Â· {u.reportedAt ? new Date(u.reportedAt).toLocaleString() : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(schedule?.baselines || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Baselines</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Compare against</Label>
              <select
                className="w-full h-9 rounded-md border bg-background px-2 text-sm max-w-md"
                value={selectedBaselineUuid}
                onChange={async (e) => {
                  const uuid = e.target.value;
                  setSelectedBaselineUuid(uuid);
                  await loadBaselineActivities(uuid, schedule);
                  if (uuid) setShowBaseline(true);
                }}
              >
                {schedule.baselines.map((b) => (
                  <option key={b.uuid} value={b.uuid}>
                    {b.name}
                    {b.createdAt ? ` Â· ${new Date(b.createdAt).toLocaleString()}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {schedule.baselines.map((b) => (
              <div
                key={b.uuid}
                className={`flex justify-between border-b border-border/40 py-1 ${
                  String(b.uuid) === String(selectedBaselineUuid) ? "font-medium" : ""
                }`}
              >
                <span>{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.createdAt ? new Date(b.createdAt).toLocaleString() : ""}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
