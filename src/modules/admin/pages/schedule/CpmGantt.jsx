import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock, Milestone, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const DAY_MS = 86400000;
const LABEL_W = 300;
const ROW_H = 48;
const HEADER_H = 56;
const PX_PER_DAY = 36;
const BAR_H = 28;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/** UAE default: Friday (5) is the only non-working day. */
const DEFAULT_NON_WORKING = new Set([5]);

function parseDate(d) {
  if (!d) return null;
  const parts = String(d).slice(0, 10).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/**
 * Gantt that reflects what the CPM engine computed.
 *
 * <p>Two axis modes. Calendar mode shows every date with non-working days shaded. Working-day
 * mode collapses them, so a bar's on-screen length equals its duration in working days — which
 * is the number the programme is actually quoted in. Weekends are still marked in the header so
 * the calendar dates stay readable.
 *
 * <p>Dragging a bar does not change dates locally. It reports the drop date to the caller,
 * which asks the server to re-solve, because moving one bar moves its successors too.
 */
export default function CpmGantt({
  activities = [],
  dependencies = [],
  onSelect,
  selectedUuid,
  onBarMove,
  baselineActivities = [],
  showBaseline = false,
  nonWorkingWeekdays,
  holidays = [],
  emptyMessage = "No activities yet. Apply a template to generate the programme.",
}) {
  const [workingDayAxis, setWorkingDayAxis] = useState(true);
  const [showFloat, setShowFloat] = useState(true);
  const dragRef = useRef(null);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [draggingUuid, setDraggingUuid] = useState(null);

  const nonWorking = useMemo(
    () => (nonWorkingWeekdays instanceof Set ? nonWorkingWeekdays : DEFAULT_NON_WORKING),
    [nonWorkingWeekdays]
  );
  const holidaySet = useMemo(
    () => new Set((holidays || []).map((h) => String(h).slice(0, 10))),
    [holidays]
  );

  const isWorkingDay = useCallback(
    (date) => !nonWorking.has(date.getDay()) && !holidaySet.has(formatDate(date)),
    [nonWorking, holidaySet]
  );

  const baselineByUuid = useMemo(() => {
    const map = new Map();
    (baselineActivities || []).forEach((b) => {
      const id = b.activityUuid || b.uuid;
      if (id) map.set(String(id), b);
    });
    return map;
  }, [baselineActivities]);

  const range = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dated = [...activities];
    if (showBaseline) baselineByUuid.forEach((b) => dated.push(b));

    let min = null;
    let max = null;
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
    return { start, end, days: Math.max(daysBetween(start, end) + 1, 16), today };
  }, [activities, showBaseline, baselineByUuid]);

  /**
   * Every date in range with its column index. In working-day mode, non-working days share the
   * previous column so they occupy no width, which is what makes bar length equal duration.
   */
  const columns = useMemo(() => {
    const cells = [];
    const indexByDate = new Map();
    let column = 0;
    for (let i = 0; i < range.days; i += 1) {
      const date = new Date(range.start.getTime() + i * DAY_MS);
      const working = isWorkingDay(date);
      if (workingDayAxis && !working) {
        // Collapsed: it still maps to a position so a bar spanning it renders continuously.
        indexByDate.set(formatDate(date), column);
        continue;
      }
      indexByDate.set(formatDate(date), column);
      cells.push({ date, working, column });
      column += 1;
    }
    return { cells, indexByDate, count: column };
  }, [range, workingDayAxis, isWorkingDay]);

  const xOf = useCallback(
    (date) => {
      if (!date) return 0;
      const key = formatDate(date);
      const hit = columns.indexByDate.get(key);
      if (hit != null) return hit * PX_PER_DAY;
      // Outside the rendered window: fall back to a calendar-day estimate.
      return daysBetween(range.start, date) * PX_PER_DAY;
    },
    [columns, range.start]
  );

  const width = Math.max(columns.count, 1) * PX_PER_DAY;
  const chartH = Math.max(activities.length, 1) * ROW_H;

  const months = useMemo(() => {
    const bands = [];
    let i = 0;
    while (i < columns.cells.length) {
      const { date } = columns.cells[i];
      const month = date.getMonth();
      const year = date.getFullYear();
      let span = 0;
      while (i + span < columns.cells.length) {
        const cur = columns.cells[i + span].date;
        if (cur.getMonth() !== month || cur.getFullYear() !== year) break;
        span += 1;
      }
      bands.push({ label: `${MONTHS[month]} ${year}`, span, startIndex: i });
      i += span;
    }
    return bands;
  }, [columns.cells]);

  const barMeta = useMemo(() => {
    const map = new Map();
    activities.forEach((a, rowIndex) => {
      const s = parseDate(a.startDate);
      const e = parseDate(a.endDate);
      if (!s || !e) return;
      const left = xOf(s);
      const right = xOf(e) + PX_PER_DAY;
      map.set(a.uuid, {
        rowIndex,
        left,
        width: Math.max(right - left, a.milestone ? PX_PER_DAY : 24),
        cy: rowIndex * ROW_H + ROW_H / 2,
        right,
      });
    });
    return map;
  }, [activities, xOf]);

  const todayLeft = xOf(range.today) + PX_PER_DAY / 2;

  const finishDrag = useCallback(
    (clientX) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setDragOffsetPx(0);
      setDraggingUuid(null);
      if (!drag || !onBarMove) return;

      const columnDelta = Math.round((clientX - drag.startX) / PX_PER_DAY);
      if (!columnDelta) return;

      const start = parseDate(drag.activity.startDate);
      if (!start) return;

      // Step through the axis the user actually sees, so dropping three columns to the right
      // moves the activity three working days, not three calendar days.
      let cursor = new Date(start.getTime());
      let remaining = Math.abs(columnDelta);
      const step = columnDelta > 0 ? 1 : -1;
      let guard = 0;
      while (remaining > 0 && guard < 3650) {
        cursor = new Date(cursor.getTime() + step * DAY_MS);
        guard += 1;
        if (!workingDayAxis || isWorkingDay(cursor)) remaining -= 1;
      }
      onBarMove(drag.activity, formatDate(cursor));
    },
    [onBarMove, workingDayAxis, isWorkingDay]
  );

  useEffect(() => {
    const onMove = (e) => {
      if (dragRef.current) setDragOffsetPx(e.clientX - dragRef.current.startX);
    };
    const onUp = (e) => {
      if (dragRef.current) finishDrag(e.clientX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [finishDrag]);

  /**
   * Arrows drawn from the correct end of each bar for the relationship type, so a start-to-start
   * overlap is visibly different from a finish-to-start hand-off.
   */
  const depPaths = useMemo(() => {
    return (dependencies || [])
      .map((d) => {
        const pred = barMeta.get(d.predecessorUuid);
        const succ = barMeta.get(d.successorUuid);
        if (!pred || !succ) return null;

        const type = (d.dependencyType || "FS").toUpperCase();
        const fromStart = type === "SS" || type === "SF";
        const toFinish = type === "FF" || type === "SF";

        const x1 = fromStart ? pred.left : pred.right;
        const y1 = pred.cy;
        const x2 = toFinish ? succ.right : succ.left;
        const y2 = succ.cy;

        const stub = fromStart ? -14 : 14;
        const midX = (x1 + stub + x2) / 2;
        const path =
          y1 === y2
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} L ${x1 + stub} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

        return {
          key: d.uuid,
          path,
          locked: d.locked,
          type,
          label: type === "FS" && !d.lagWorkingDays ? null : `${type}${d.lagWorkingDays ? `+${d.lagWorkingDays}` : ""}`,
          labelX: midX,
          labelY: (y1 + y2) / 2,
        };
      })
      .filter(Boolean);
  }, [dependencies, barMeta]);

  const maxIndent = useMemo(
    () => Math.max(0, ...activities.map((a) => (a.parentUuid ? 1 : 0))),
    [activities]
  );

  return (
    <Card className="overflow-hidden hidden lg:block">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-sm font-semibold">Programme</CardTitle>
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2">
            <Switch id="wd-axis" checked={workingDayAxis} onCheckedChange={setWorkingDayAxis} />
            <Label htmlFor="wd-axis" className="text-xs cursor-pointer">Working-day axis</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="show-float" checked={showFloat} onCheckedChange={setShowFloat} />
            <Label htmlFor="show-float" className="text-xs cursor-pointer">Float</Label>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-[#18181B]" /> Activity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-[#C4845A]" /> Progress
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm border-2 border-[#B45309] bg-transparent" /> Critical
            </span>
            {showFloat && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-5 rounded-sm bg-emerald-500/40" /> Float
              </span>
            )}
            {showBaseline && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-5 rounded-sm bg-zinc-400/40" /> Baseline
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_W + width }}>
            <div className="flex border-b border-border/40 bg-secondary/50 sticky top-0 z-20">
              <div
                className="shrink-0 border-r border-border/40 px-3 flex items-end pb-2 text-xs font-semibold text-muted-foreground"
                style={{ width: LABEL_W, height: HEADER_H }}
              >
                Activity {workingDayAxis && <span className="ml-1 font-normal">· non-working days hidden</span>}
              </div>
              <div className="relative" style={{ width, height: HEADER_H }}>
                <div className="absolute inset-x-0 top-0 flex h-6 border-b border-border/40">
                  {months.map((m) => (
                    <div
                      key={`${m.label}-${m.startIndex}`}
                      className="flex items-center justify-center text-[11px] font-semibold border-r border-border/30"
                      style={{ width: m.span * PX_PER_DAY }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-7">
                  {columns.cells.map((cell) => {
                    const isToday = formatDate(cell.date) === formatDate(range.today);
                    return (
                      <div
                        key={cell.column}
                        className={`flex flex-col items-center justify-center border-r border-border/20 text-[10px] leading-none ${
                          cell.working ? "text-muted-foreground" : "bg-secondary/80 text-muted-foreground"
                        } ${isToday ? "bg-rose-100 font-bold text-rose-700" : ""}`}
                        style={{ width: PX_PER_DAY }}
                      >
                        <span className="opacity-70">{DAY_INITIALS[cell.date.getDay()]}</span>
                        <span className="mt-0.5">{cell.date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex relative" style={{ minHeight: chartH }}>
              <div className="shrink-0 border-r border-border/40 bg-card z-10" style={{ width: LABEL_W }}>
                {activities.length === 0 ? (
                  <div className="px-3 py-8 text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                ) : (
                  activities.map((a) => {
                    const pct = Math.min(100, Math.max(0, a.percentComplete || 0));
                    const selected = selectedUuid === a.uuid;
                    const indent = a.parentUuid ? 16 : 0;
                    return (
                      <button
                        type="button"
                        key={a.uuid}
                        onClick={() => onSelect?.(a)}
                        className={`w-full text-left border-b border-border/30 hover:bg-secondary/50 ${
                          selected ? "bg-accent/60" : ""
                        }`}
                        style={{ height: ROW_H, paddingLeft: 12 + indent, paddingRight: 12 }}
                      >
                        <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                          {a.milestone && <Milestone className="h-3 w-3 shrink-0 text-copper-foreground" />}
                          {a.lockedDuration && (
                            <Lock className="h-3 w-3 shrink-0 text-amber-700" title={a.constraintNote || "Locked duration"} />
                          )}
                          {a.constrainedByCaseUuid && (
                            <ShieldAlert className="h-3 w-3 shrink-0 text-red-700" title="Held by an unapproved permit" />
                          )}
                          {a.activityCode && (
                            <span className="font-mono text-[10px] text-muted-foreground">{a.activityCode}</span>
                          )}
                          <span className="truncate">{a.name}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {a.durationWorkingDays != null ? `${a.durationWorkingDays}d · ` : ""}
                          {String(a.startDate).slice(0, 10)} → {String(a.endDate).slice(0, 10)} · {pct}%
                          {a.totalFloat != null && (
                            <> · {a.totalFloat <= 0 ? "critical" : `${a.totalFloat}d float`}</>
                          )}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="relative" style={{ width, height: chartH }}>
                {columns.cells.map((cell) =>
                  cell.working ? null : (
                    <div
                      key={`nw-${cell.column}`}
                      className="absolute top-0 bottom-0 bg-secondary/40 pointer-events-none"
                      style={{ left: cell.column * PX_PER_DAY, width: PX_PER_DAY }}
                    />
                  )
                )}

                {activities.map((a, idx) => (
                  <div
                    key={`row-${a.uuid}`}
                    className="absolute left-0 right-0 border-b border-border/20 pointer-events-none"
                    style={{ top: (idx + 1) * ROW_H }}
                  />
                ))}

                {todayLeft >= 0 && todayLeft <= width && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                    style={{ left: todayLeft }}
                  >
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded bg-rose-500 px-1 text-[9px] font-bold text-white">
                      Today
                    </span>
                  </div>
                )}

                <svg className="absolute inset-0 z-[5] pointer-events-none" width={width} height={chartH}>
                  <defs>
                    <marker id="cpm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#a1a1aa" />
                    </marker>
                    <marker id="cpm-arrow-locked" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#b45309" />
                    </marker>
                  </defs>
                  {depPaths.map((d) => (
                    <g key={d.key}>
                      <path
                        d={d.path}
                        fill="none"
                        stroke={d.locked ? "#b45309" : "#a1a1aa"}
                        strokeWidth={d.locked ? 2.25 : 1.75}
                        strokeDasharray={d.locked ? "4 2" : undefined}
                        markerEnd={d.locked ? "url(#cpm-arrow-locked)" : "url(#cpm-arrow)"}
                      />
                      {d.label && (
                        <text
                          x={d.labelX}
                          y={d.labelY - 3}
                          textAnchor="middle"
                          className="fill-muted-foreground"
                          style={{ fontSize: 9, fontWeight: 600 }}
                        >
                          {d.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {showBaseline &&
                  activities.map((a) => {
                    const base = baselineByUuid.get(String(a.uuid));
                    const meta = barMeta.get(a.uuid);
                    if (!base || !meta) return null;
                    const s = parseDate(base.startDate);
                    const e = parseDate(base.endDate);
                    if (!s || !e) return null;
                    const left = xOf(s);
                    return (
                      <div
                        key={`base-${a.uuid}`}
                        className="absolute z-[8] pointer-events-none rounded-md bg-zinc-400/35 border border-zinc-500/30"
                        style={{
                          left,
                          top: meta.rowIndex * ROW_H + (ROW_H - BAR_H) / 2 + 4,
                          width: Math.max(xOf(e) + PX_PER_DAY - left, 24),
                          height: BAR_H - 4,
                        }}
                        title={`Baseline ${base.startDate} → ${base.endDate}`}
                      />
                    );
                  })}

                {showFloat &&
                  activities.map((a) => {
                    const meta = barMeta.get(a.uuid);
                    if (!meta || !a.totalFloat || a.totalFloat <= 0 || !a.lateFinish) return null;
                    const lateFinish = parseDate(a.lateFinish);
                    if (!lateFinish) return null;
                    const floatRight = xOf(lateFinish) + PX_PER_DAY;
                    if (floatRight <= meta.right) return null;
                    return (
                      <div
                        key={`float-${a.uuid}`}
                        className="absolute z-[6] pointer-events-none rounded-sm bg-emerald-500/30"
                        style={{
                          left: meta.right,
                          top: meta.rowIndex * ROW_H + ROW_H / 2 - 2,
                          width: floatRight - meta.right,
                          height: 4,
                        }}
                        title={`${a.totalFloat} working days of float before this delays the finish`}
                      />
                    );
                  })}

                {activities.map((a) => {
                  const meta = barMeta.get(a.uuid);
                  if (!meta) return null;
                  const pct = Math.min(100, Math.max(0, a.percentComplete || 0));
                  const selected = selectedUuid === a.uuid;
                  const isDragging = draggingUuid === a.uuid;
                  const left = meta.left + (isDragging ? dragOffsetPx : 0);

                  const tooltip = [
                    `${a.activityCode ? `${a.activityCode} · ` : ""}${a.name}`,
                    `${a.startDate} → ${a.endDate}`,
                    a.durationWorkingDays != null ? `${a.durationWorkingDays} working days` : null,
                    a.totalFloat != null
                      ? a.totalFloat <= 0
                        ? "On the critical path: any delay moves the finish date"
                        : `${a.totalFloat} days total float, ${a.freeFloat ?? 0} free`
                      : null,
                    a.constraintNote,
                    a.lockedDuration ? "Locked duration: cannot be compressed" : null,
                    `${pct}% complete`,
                    onBarMove ? "Drag to reschedule; the server re-solves the network" : null,
                  ]
                    .filter(Boolean)
                    .join("\n");

                  if (a.milestone) {
                    return (
                      <button
                        type="button"
                        key={`bar-${a.uuid}`}
                        onClick={() => onSelect?.(a)}
                        title={tooltip}
                        className={`absolute z-10 ${selected ? "ring-2 ring-offset-1 ring-[#C4845A] rounded" : ""}`}
                        style={{
                          left: left + PX_PER_DAY / 2 - BAR_H / 2,
                          top: meta.rowIndex * ROW_H + (ROW_H - BAR_H) / 2,
                          width: BAR_H,
                          height: BAR_H,
                        }}
                      >
                        <span
                          className={`block h-full w-full rotate-45 rounded-[3px] ${
                            a.critical ? "bg-[#B45309]" : "bg-[#18181B]"
                          }`}
                        />
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      key={`bar-${a.uuid}`}
                      onClick={() => onSelect?.(a)}
                      onMouseDown={(e) => {
                        if (!onBarMove) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect?.(a);
                        dragRef.current = { activity: a, startX: e.clientX };
                        setDraggingUuid(a.uuid);
                        setDragOffsetPx(0);
                      }}
                      title={tooltip}
                      className={`absolute z-10 flex items-center overflow-hidden rounded-md text-left transition-shadow hover:shadow-md ${
                        onBarMove && !a.lockedDuration ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      } ${selected ? "ring-2 ring-offset-1 ring-[#C4845A]" : ""} ${
                        a.critical ? "outline outline-2 outline-offset-1 outline-[#B45309]" : ""
                      }`}
                      style={{
                        left,
                        top: meta.rowIndex * ROW_H + (ROW_H - BAR_H) / 2,
                        width: Math.max(meta.width, 24),
                        height: BAR_H,
                        background: a.publishStatus === "PUBLISHED" ? "#18181B" : "#3f3f46",
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[#C4845A]"
                        style={{ width: `${pct}%`, opacity: 0.95 }}
                      />
                      <span className="relative z-[1] px-2 text-[11px] font-semibold text-white truncate drop-shadow-sm flex items-center gap-1">
                        {a.lockedDuration && <Lock className="h-3 w-3 shrink-0" />}
                        {a.constrainedByCaseUuid && <ShieldAlert className="h-3 w-3 shrink-0" />}
                        {a.name}
                      </span>
                    </button>
                  );
                })}

                {!activities.length && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground px-6 text-center">
                    {emptyMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {maxIndent > 0 && (
          <p className="border-t border-border/40 px-4 py-2 text-[11px] text-muted-foreground">
            Indented rows are children of the summary activity above them.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
