import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Plus, Trash2, Upload, Camera, Save,
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
  updateScheduleActivity,
  deleteScheduleActivity,
  addScheduleDependency,
  publishSchedule,
  createScheduleBaseline,
  fetchScheduleBaseline,
  postActivityProgress,
  fetchActivityProgress,
} from "../../api/schedule.api";
import ScheduleReadinessStrip from "./ScheduleReadinessStrip";
import { ROUTES } from "@/shared/constants/routes";
import { Switch } from "@/components/ui/switch";

const DAY_MS = 86400000;

function parseDate(d) {
  if (!d) return null;
  const parts = String(d).slice(0, 10).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

const LABEL_W = 260;
const ROW_H = 48;
const HEADER_H = 56;
const PX_PER_DAY = 36;
const BAR_H = 28;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SimpleGantt({
  activities,
  dependencies = [],
  onSelect,
  selectedUuid,
  onBarMove,
  criticalPathUuids = [],
  baselineActivities = [],
  showBaseline = false,
}) {
  const list = useMemo(() => activities || [], [activities]);
  const criticalSet = useMemo(
    () => new Set((criticalPathUuids || []).map(String)),
    [criticalPathUuids]
  );
  const baselineByUuid = useMemo(() => {
    const map = new Map();
    (baselineActivities || []).forEach((b) => {
      const id = b.activityUuid || b.uuid;
      if (id) map.set(String(id), b);
    });
    return map;
  }, [baselineActivities]);
  const dragRef = useRef(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [draggingUuid, setDraggingUuid] = useState(null);

  const range = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dated = [...list];
    if (showBaseline) {
      baselineByUuid.forEach((b) => dated.push(b));
    }
    if (!dated.length) {
      const start = new Date(today.getTime() - 3 * DAY_MS);
      return { start, end: new Date(today.getTime() + 21 * DAY_MS), days: 24, today };
    }
    let min = parseDate(dated[0].startDate);
    let max = parseDate(dated[0].endDate);
    dated.forEach((a) => {
      const s = parseDate(a.startDate);
      const e = parseDate(a.endDate);
      if (s && (!min || s < min)) min = s;
      if (e && (!max || e > max)) max = e;
    });
    if (!min || !max) {
      const start = new Date(today.getTime() - 3 * DAY_MS);
      return { start, end: new Date(today.getTime() + 21 * DAY_MS), days: 24, today };
    }
    const start = new Date(min.getTime() - 3 * DAY_MS);
    const end = new Date(max.getTime() + 7 * DAY_MS);
    return { start, end, days: Math.max(daysBetween(start, end), 16), today };
  }, [list, showBaseline, baselineByUuid]);

  const width = range.days * PX_PER_DAY;
  const chartH = Math.max(list.length, 1) * ROW_H;

  const months = useMemo(() => {
    const bands = [];
    let i = 0;
    while (i < range.days) {
      const d = new Date(range.start.getTime() + i * DAY_MS);
      const month = d.getMonth();
      const year = d.getFullYear();
      let span = 0;
      while (i + span < range.days) {
        const cur = new Date(range.start.getTime() + (i + span) * DAY_MS);
        if (cur.getMonth() !== month || cur.getFullYear() !== year) break;
        span += 1;
      }
      bands.push({ label: `${MONTHS[month]} ${year}`, span, startIndex: i });
      i += span;
    }
    return bands;
  }, [range]);

  const barMeta = useMemo(() => {
    const map = new Map();
    list.forEach((a, rowIndex) => {
      const s = parseDate(a.startDate);
      const e = parseDate(a.endDate);
      const left = daysBetween(range.start, s) * PX_PER_DAY;
      const barDays = Math.max(daysBetween(s, e) + 1, 1);
      map.set(a.uuid, {
        rowIndex,
        left,
        width: barDays * PX_PER_DAY,
        cy: rowIndex * ROW_H + ROW_H / 2,
        right: left + barDays * PX_PER_DAY,
      });
    });
    return map;
  }, [list, range.start]);

  const todayLeft = daysBetween(range.start, range.today) * PX_PER_DAY + PX_PER_DAY / 2;

  const finishDrag = useCallback(
    (clientX) => {
      const d = dragRef.current;
      if (!d || !onBarMove) {
        dragRef.current = null;
        setDragOffsetPx(0);
        setDraggingUuid(null);
        return;
      }
      const deltaPx = clientX - d.startX;
      const dayDelta = Math.round(deltaPx / PX_PER_DAY);
      dragRef.current = null;
      setDragOffsetPx(0);
      setDraggingUuid(null);
      if (!dayDelta) return;
      const start = parseDate(d.activity.startDate);
      const end = parseDate(d.activity.endDate);
      if (!start || !end) return;
      const newStart = new Date(start.getTime() + dayDelta * DAY_MS);
      const newEnd = new Date(end.getTime() + dayDelta * DAY_MS);
      onBarMove(d.activity, {
        startDate: formatDate(newStart),
        endDate: formatDate(newEnd),
      });
    },
    [onBarMove]
  );

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      setDragOffsetPx(e.clientX - dragRef.current.startX);
    };
    const onUp = (e) => {
      if (!dragRef.current) return;
      finishDrag(e.clientX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [finishDrag]);

  const depPaths = useMemo(() => {
    return (dependencies || [])
      .map((d) => {
        const pred = barMeta.get(d.predecessorUuid);
        const succ = barMeta.get(d.successorUuid);
        if (!pred || !succ) return null;
        const x1 = pred.right;
        const y1 = pred.cy;
        const x2 = succ.left;
        const y2 = succ.cy;
        const midX = Math.max(x1 + 12, Math.min(x2 - 12, (x1 + x2) / 2));
        const path =
          y1 === y2
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        return { key: d.uuid, path, x2, y2 };
      })
      .filter(Boolean);
  }, [dependencies, barMeta]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold">Gantt chart</CardTitle>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap justify-end">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-[#18181B]" /> Task
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-[#C4845A]" /> Progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm border-2 border-[#B45309] bg-transparent" /> Critical
          </span>
          {showBaseline && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-zinc-400/40" /> Baseline
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-rose-500" /> Today
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_W + width }}>
            {/* Header */}
            <div className="flex border-b border-border/40 bg-secondary/50 sticky top-0 z-20">
              <div
                className="shrink-0 border-r border-border/40 px-3 flex items-end pb-2 text-xs font-semibold text-muted-foreground"
                style={{ width: LABEL_W, height: HEADER_H }}
              >
                Activity / WBS
              </div>
              <div className="relative" style={{ width, height: HEADER_H }}>
                <div className="absolute inset-x-0 top-0 flex h-6 border-b border-border/40">
                  {months.map((m) => (
                    <div
                      key={`${m.label}-${m.startIndex}`}
                      className="flex items-center justify-center text-[11px] font-semibold text-foreground border-r border-border/30"
                      style={{ width: m.span * PX_PER_DAY }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-7">
                  {Array.from({ length: range.days }).map((_, i) => {
                    const d = new Date(range.start.getTime() + i * DAY_MS);
                    const weekend = d.getDay() === 0 || d.getDay() === 6;
                    const isToday = daysBetween(d, range.today) === 0;
                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-center border-r border-border/20 text-[10px] leading-none ${
                          weekend ? "bg-secondary/80 text-muted-foreground" : "text-muted-foreground"
                        } ${isToday ? "bg-rose-100 font-bold text-rose-700" : ""}`}
                        style={{ width: PX_PER_DAY }}
                      >
                        <span className="opacity-70">{["S", "M", "T", "W", "T", "F", "S"][d.getDay()]}</span>
                        <span className="mt-0.5">{d.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex relative" style={{ minHeight: chartH }}>
              <div className="shrink-0 border-r border-border/40 bg-card z-10" style={{ width: LABEL_W }}>
                {list.length === 0 ? (
                  <div className="px-3 py-8 text-sm text-muted-foreground">No activities yet</div>
                ) : (
                  list.map((a) => {
                    const pct = Math.min(100, Math.max(0, a.percentComplete || 0));
                    const selected = selectedUuid === a.uuid;
                    return (
                      <button
                        type="button"
                        key={a.uuid}
                        onClick={() => onSelect(a)}
                        className={`w-full text-left px-3 border-b border-border/30 hover:bg-secondary/50 ${
                          selected ? "bg-accent/60" : ""
                        }`}
                        style={{ height: ROW_H }}
                      >
                        <p className="text-sm font-semibold truncate text-foreground">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {String(a.startDate).slice(0, 10)} → {String(a.endDate).slice(0, 10)} · {pct}%
                          {a.publishStatus === "PUBLISHED" ? " · Live" : " · Draft"}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="relative bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(100%-1px),oklch(var(--border)/0.5)_calc(100%-1px),oklch(var(--border)/0.5)_100%)] bg-[length:36px_100%]" style={{ width, height: chartH }}>
                {/* Weekend columns */}
                {Array.from({ length: range.days }).map((_, i) => {
                  const d = new Date(range.start.getTime() + i * DAY_MS);
                  const weekend = d.getDay() === 0 || d.getDay() === 6;
                  if (!weekend) return null;
                  return (
                    <div
                      key={`w-${i}`}
                      className="absolute top-0 bottom-0 bg-secondary/40 pointer-events-none"
                      style={{ left: i * PX_PER_DAY, width: PX_PER_DAY }}
                    />
                  );
                })}

                {/* Row lines */}
                {list.map((a, idx) => (
                  <div
                    key={`row-${a.uuid}`}
                    className="absolute left-0 right-0 border-b border-border/20 pointer-events-none"
                    style={{ top: (idx + 1) * ROW_H }}
                  />
                ))}

                {/* Today marker */}
                {todayLeft >= 0 && todayLeft <= width && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                    style={{ left: todayLeft }}
                  >
                    <span className="absolute -top-0 left-1/2 -translate-x-1/2 rounded bg-rose-500 px-1 text-[9px] font-bold text-white">
                      Today
                    </span>
                  </div>
                )}

                {/* Dependency arrows */}
                <svg className="absolute inset-0 z-[5] pointer-events-none" width={width} height={chartH}>
                  <defs>
                    <marker id="gantt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#a1a1aa" />
                    </marker>
                  </defs>
                  {depPaths.map((d) => (
                    <path
                      key={d.key}
                      d={d.path}
                      fill="none"
                      stroke="#a1a1aa"
                      strokeWidth="1.75"
                      markerEnd="url(#gantt-arrow)"
                    />
                  ))}
                </svg>

                {/* Baseline ghost bars */}
                {showBaseline &&
                  list.map((a) => {
                    const base = baselineByUuid.get(String(a.uuid));
                    if (!base) return null;
                    const s = parseDate(base.startDate);
                    const e = parseDate(base.endDate);
                    if (!s || !e) return null;
                    const left = daysBetween(range.start, s) * PX_PER_DAY;
                    const barDays = Math.max(daysBetween(s, e) + 1, 1);
                    const meta = barMeta.get(a.uuid);
                    if (!meta) return null;
                    return (
                      <div
                        key={`base-${a.uuid}`}
                        className="absolute z-[8] pointer-events-none rounded-md bg-zinc-400/35 border border-zinc-500/30"
                        style={{
                          left,
                          top: meta.rowIndex * ROW_H + (ROW_H - BAR_H) / 2 + 4,
                          width: Math.max(barDays * PX_PER_DAY, 48),
                          height: BAR_H - 4,
                        }}
                        title={`Baseline: ${base.startDate} → ${base.endDate}`}
                      />
                    );
                  })}

                {/* Task bars */}
                {list.map((a) => {
                  const meta = barMeta.get(a.uuid);
                  if (!meta) return null;
                  const pct = Math.min(100, Math.max(0, a.percentComplete || 0));
                  const selected = selectedUuid === a.uuid;
                  const published = a.publishStatus === "PUBLISHED";
                  const isCritical = criticalSet.has(String(a.uuid));
                  const isDragging = draggingUuid === a.uuid;
                  const left = meta.left + (isDragging ? dragOffsetPx : 0);
                  return (
                    <button
                      type="button"
                      key={`bar-${a.uuid}`}
                      onClick={() => onSelect(a)}
                      onMouseDown={(e) => {
                        if (!onBarMove) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(a);
                        dragRef.current = { activity: a, startX: e.clientX };
                        setDraggingUuid(a.uuid);
                        setDragOffsetPx(0);
                      }}
                      title={`${a.name}\n${a.startDate} → ${a.endDate}\n${pct}% complete${isCritical ? "\nCritical path" : ""}\nDrag horizontally to reschedule`}
                      className={`absolute z-10 flex items-center overflow-hidden rounded-md text-left transition-shadow hover:shadow-md ${
                        onBarMove ? "cursor-grab active:cursor-grabbing" : ""
                      } ${selected ? "ring-2 ring-offset-1 ring-[#C4845A]" : ""} ${
                        isCritical ? "outline outline-2 outline-offset-1 outline-[#B45309]" : ""
                      } ${published ? "" : "opacity-90"}`}
                      style={{
                        left,
                        top: meta.rowIndex * ROW_H + (ROW_H - BAR_H) / 2,
                        width: Math.max(meta.width, 48),
                        height: BAR_H,
                        background: published ? "#18181B" : "#3f3f46",
                        boxShadow: isCritical ? "0 0 0 1px #C4845A" : undefined,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[#C4845A]"
                        style={{ width: `${pct}%`, opacity: 0.95 }}
                      />
                      <span className="relative z-[1] px-2 text-[11px] font-semibold text-white truncate drop-shadow-sm">
                        {a.name} · {pct}%
                      </span>
                    </button>
                  );
                })}

                {!list.length && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Add activities to populate the Gantt timeline
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectSchedulePage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [schedule, setSchedule] = useState(null);
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
  });
  const [depPred, setDepPred] = useState("");
  const [depSucc, setDepSucc] = useState("");
  const [progressForm, setProgressForm] = useState({ percentComplete: 0, notes: "", labourHours: "" });
  const [publishAllowed, setPublishAllowed] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [selectedBaselineUuid, setSelectedBaselineUuid] = useState("");
  const [baselineActivities, setBaselineActivities] = useState([]);
  const [baselineNote, setBaselineNote] = useState("");

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
        /* network — fall through to ghost dates */
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

  useEffect(() => {
    load();
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

  const handleCreate = () =>
    run(
      () =>
        createScheduleActivity(projectId, {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          percentComplete: Number(form.percentComplete) || 0,
          assigneeAccountId: form.assigneeAccountId ? Number(form.assigneeAccountId) : null,
        }),
      "Activity created"
    );

  const handleUpdateSelected = () => {
    if (!selected) return;
    run(
      () =>
        updateScheduleActivity(selected.uuid, {
          name: selected.name,
          startDate: selected.startDate,
          endDate: selected.endDate,
          percentComplete: Number(selected.percentComplete) || 0,
          assigneeAccountId: selected.assigneeAccountId || null,
        }),
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

  const handlePublish = () => run(() => publishSchedule(projectId), "Schedule published");
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
    }, "Progress posted");
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activities = schedule?.activities || [];
  const deps = schedule?.dependencies || [];
  const criticalPathUuids =
    schedule?.criticalPath || schedule?.criticalPathActivityUuids || [];

  return (
    <PageShell className="max-w-7xl mx-auto">
      <PageTitle
        title="Schedule workspace"
        subtitle="Readiness · Gantt · progress in one place"
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

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {baselineNote && showBaseline && (
        <p className="text-xs text-amber-700">{baselineNote}</p>
      )}

      <SimpleGantt
        activities={activities}
        dependencies={deps}
        onSelect={setSelected}
        selectedUuid={selected?.uuid}
        criticalPathUuids={criticalPathUuids}
        baselineActivities={baselineActivities}
        showBaseline={showBaseline}
        onBarMove={(activity, dates) =>
          run(
            () =>
              updateScheduleActivity(activity.uuid, {
                name: activity.name,
                startDate: dates.startDate,
                endDate: dates.endDate,
                percentComplete: activity.percentComplete,
                assigneeAccountId: activity.assigneeAccountId,
                delayReason: activity.delayReason,
              }),
            "Dates updated"
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
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
                <Label className="text-xs">Assignee account ID</Label>
                <Input value={form.assigneeAccountId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeAccountId: e.target.value }))}
                  placeholder="optional" />
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
                <option value="">Select…</option>
                {activities.map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Successor</Label>
              <select className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                value={depSucc} onChange={(e) => setDepSucc(e.target.value)}>
                <option value="">Select…</option>
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
                  return <li key={d.uuid}>{p} → {s} (FS)</li>;
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Activity drawer — {selected.name}</CardTitle>
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
                  <Label className="text-xs">%</Label>
                  <Input type="number" min={0} max={100} value={selected.percentComplete}
                    onChange={(e) => setSelected((s) => ({ ...s, percentComplete: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Assignee account ID</Label>
                  <Input value={selected.assigneeAccountId || ""}
                    onChange={(e) => setSelected((s) => ({
                      ...s,
                      assigneeAccountId: e.target.value ? Number(e.target.value) : null,
                    }))} />
                </div>
              </div>
              <Button size="sm" disabled={busy} onClick={handleUpdateSelected}>Save dates / %</Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1">
                <Camera className="h-4 w-4" /> Progress update
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
              <Button size="sm" disabled={busy} onClick={handleProgress}>Post progress</Button>
              {progressHistory.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-auto">
                  {progressHistory.map((u) => (
                    <li key={u.uuid}>
                      {u.percentComplete}% · {u.notes || "—"} · {u.reportedAt ? new Date(u.reportedAt).toLocaleString() : ""}
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
                    {b.createdAt ? ` · ${new Date(b.createdAt).toLocaleString()}` : ""}
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
