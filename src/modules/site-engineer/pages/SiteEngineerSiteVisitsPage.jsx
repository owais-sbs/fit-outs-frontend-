import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  Loader2,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchMySiteVisits } from "@/modules/admin/api/site-visits.api";
import { ROUTES } from "@/shared/constants/routes";

const TAB = { UPCOMING: "upcoming", COMPLETED: "completed", ALL: "all" };
const VIEW = { CALENDAR: "calendar", LIST: "list" };

const STATUS_BADGE = {
  SCHEDULED: "bg-amber-500/15 text-amber-700 border-none",
  IN_PROGRESS: "bg-blue-500/15 text-blue-700 border-none",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 border-none",
  CANCELLED: "bg-muted text-muted-foreground border-none",
};

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function toDateKey(value) {
  if (!value) return null;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

function fmtDate(d) {
  const key = toDateKey(d);
  if (!key) return "—";
  return new Date(`${key}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isUpcoming(v) {
  const s = String(v?.status || "").toUpperCase();
  return s === "SCHEDULED" || s === "IN_PROGRESS";
}

function isCompleted(v) {
  return String(v?.status || "").toUpperCase() === "COMPLETED";
}

function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, key });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function VisitCard({ visit }) {
  const reportHref = ROUTES.SITE_ENGINEER.SITE_VISIT_REPORT.replace(":visitId", visit.uuid);
  const status = String(visit.status || "SCHEDULED").toUpperCase();
  return (
    <Surface className="p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {visit.locationDetails?.address
                || visit.notes
                || visit.propertyType
                || `Visit ${visit.uuid?.slice(0, 8)}`}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {fmtDate(visit.scheduledDate)}
            {visit.scheduledTime ? ` · ${visit.scheduledTime}` : ""}
          </p>
        </div>
        <Badge className={STATUS_BADGE[status] || "border-none"}>{status}</Badge>
      </div>
      {(visit.notes || visit.propertyType) && (
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
          {visit.notes || visit.propertyType}
        </p>
      )}
      <Button asChild size="sm" variant="outline">
        <Link to={reportHref}>
          {status === "COMPLETED" ? "View report" : "Start inspection"}{" "}
          <ExternalLink className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </Surface>
  );
}

export default function SiteEngineerSiteVisitsPage() {
  const now = new Date();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(TAB.ALL);
  const [view, setView] = useState(VIEW.CALENDAR);
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMySiteVisits()
      .then((data) => {
        if (!cancelled) setVisits(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.response?.data?.message || e.message || "Failed to load visits");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = visits.filter((v) => String(v.status || "").toUpperCase() !== "CANCELLED");
    if (tab === TAB.UPCOMING) list = list.filter(isUpcoming);
    if (tab === TAB.COMPLETED) list = list.filter(isCompleted);
    return [...list].sort((a, b) =>
      String(a.scheduledDate || "").localeCompare(String(b.scheduledDate || ""))
    );
  }, [visits, tab]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const v of filtered) {
      const key = toDateKey(v.scheduledDate);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(v);
    }
    return map;
  }, [filtered]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  const selectedVisits = selectedDay ? byDay.get(selectedDay) || [] : [];

  const upcomingList = useMemo(() => {
    return visits
      .filter((v) => String(v.status || "").toUpperCase() !== "CANCELLED")
      .filter(isUpcoming)
      .sort((a, b) => String(a.scheduledDate || "").localeCompare(String(b.scheduledDate || "")));
  }, [visits]);

  const rightPanelVisits = selectedDay ? selectedVisits : upcomingList;
  const rightPanelTitle = selectedDay
    ? fmtDate(selectedDay)
    : "Upcoming visits";
  const rightPanelHint = selectedDay
    ? (selectedVisits.length
      ? `${selectedVisits.length} visit${selectedVisits.length > 1 ? "s" : ""} on this day`
      : "No visits on this day")
    : (upcomingList.length
      ? `${upcomingList.length} upcoming`
      : "No upcoming visits");

  const shiftMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const counts = useMemo(() => {
    const active = visits.filter((v) => String(v.status || "").toUpperCase() !== "CANCELLED");
    return {
      upcoming: active.filter(isUpcoming).length,
      completed: active.filter(isCompleted).length,
      all: active.length,
    };
  }, [visits]);

  return (
    <PageShell>
      <PageTitle
        title="Site Visits"
        subtitle="Your assigned visits on a calendar — upcoming and already completed"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={tab === TAB.ALL ? "default" : "outline"}
                onClick={() => setTab(TAB.ALL)}
              >
                All ({counts.all})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tab === TAB.UPCOMING ? "default" : "outline"}
                onClick={() => setTab(TAB.UPCOMING)}
              >
                Upcoming ({counts.upcoming})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={tab === TAB.COMPLETED ? "default" : "outline"}
                onClick={() => setTab(TAB.COMPLETED)}
              >
                Completed ({counts.completed})
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={view === VIEW.CALENDAR ? "default" : "outline"}
                onClick={() => setView(VIEW.CALENDAR)}
              >
                <CalendarDays className="mr-1 h-4 w-4" /> Calendar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === VIEW.LIST ? "default" : "outline"}
                onClick={() => setView(VIEW.LIST)}
              >
                <List className="mr-1 h-4 w-4" /> List
              </Button>
            </div>
          </div>

          {view === VIEW.CALENDAR ? (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Surface className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <p className="text-sm font-semibold">{monthLabel(cursor.year, cursor.month)}</p>
                  <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => shiftMonth(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="min-h-[64px] rounded-md border border-border/30 bg-slate-200/70 dark:bg-slate-800/50" />;
                    }
                    const dayVisits = byDay.get(cell.key) || [];
                    const isSelected = selectedDay === cell.key;
                    const isToday = cell.key === todayStr();
                    const primaryStatus = dayVisits.length
                      ? String(dayVisits[0].status || "SCHEDULED").toUpperCase()
                      : null;
                    const fillClass = !primaryStatus
                      ? "border-slate-300/80 bg-slate-200 text-slate-700 hover:bg-slate-300/90 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      : primaryStatus === "COMPLETED"
                        ? "border-emerald-600/40 bg-emerald-500 text-white hover:bg-emerald-600"
                        : primaryStatus === "IN_PROGRESS"
                          ? "border-blue-600/40 bg-blue-500 text-white hover:bg-blue-600"
                          : primaryStatus === "CANCELLED"
                            ? "border-border/50 bg-muted text-muted-foreground"
                            : "border-amber-600/40 bg-amber-500 text-white hover:bg-amber-600";
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => setSelectedDay((prev) => (prev === cell.key ? null : cell.key))}
                        className={`min-h-[64px] rounded-md border p-1.5 text-left transition-colors ${fillClass} ${
                          isSelected ? "ring-2 ring-primary ring-offset-1" : ""
                        } ${isToday && !primaryStatus ? "ring-1 ring-primary/50" : ""}`}
                      >
                        <span className={`text-xs font-semibold ${isToday && !primaryStatus ? "text-primary" : ""}`}>
                          {cell.day}
                        </span>
                        {dayVisits.length > 0 && (
                          <p className="mt-1 text-[10px] font-medium leading-tight text-white/95">
                            {dayVisits.length === 1
                              ? (primaryStatus === "COMPLETED"
                                ? "Completed"
                                : primaryStatus === "IN_PROGRESS"
                                  ? "In progress"
                                  : "Scheduled")
                              : `${dayVisits.length} visits`}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-slate-300" /> Empty day
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-amber-500" /> Scheduled
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-blue-500" /> In progress
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Completed
                  </span>
                </div>
              </Surface>

              <div className="space-y-3">
                <Surface className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{rightPanelTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rightPanelHint}</p>
                    </div>
                    {selectedDay && (
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedDay(null)}>
                        Show upcoming
                      </Button>
                    )}
                  </div>
                </Surface>
                {rightPanelVisits.length === 0 ? (
                  <Surface className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {selectedDay ? "No visits on this day." : "No upcoming visits assigned."}
                  </Surface>
                ) : (
                  rightPanelVisits.map((v) => <VisitCard key={v.uuid} visit={v} />)
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.length === 0 ? (
                <Surface className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No visits in this filter.
                </Surface>
              ) : (
                filtered.map((v) => <VisitCard key={v.uuid} visit={v} />)
              )}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
