import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock, GanttChart } from "lucide-react";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/shared/context/auth-context";
import { fetchEmployeeSiteVisits } from "@/modules/admin/api/site-visits.api";
import { fetchAllLeads } from "@/modules/admin/api/leads.api";
import { fetchAllClients } from "@/modules/admin/api/clients.api";
import { fetchMyScheduleActivities } from "@/modules/admin/api/schedule.api";
import { ROUTES } from "@/shared/constants/routes";
import {
  buildEventsByDate,
  mapScheduleActivityToCalendarEvent,
  mapSiteVisitToCalendarEvent,
} from "@/shared/utils/scheduleCalendar";

// ── Calendar helpers ──────────────────────────────────────────────────────────
function ds(y, m, d) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false, date: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true, date: ds(year, month, d) });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, current: false, date: null });
  return cells;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_DOT  = { Scheduled: "bg-amber-500",  Completed: "bg-emerald-500" };
const STATUS_PILL = { Scheduled: "bg-amber-500/15 text-amber-700",  Completed: "bg-emerald-500/15 text-emerald-700" };
const PILL_COLOR  = ["bg-primary/15 text-primary border-primary/20", "bg-emerald-500/15 text-emerald-700 border-emerald-500/20"];
const SCHEDULE_PILL = "bg-violet-500/15 text-violet-800 border-violet-500/25";

export default function EmployeeCalendarPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [detail, setDetail] = useState(null);
  const [visits, setVisits] = useState([]);
  const [scheduleActivities, setScheduleActivities] = useState([]);
  const today = todayStr();

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    Promise.all([
      fetchEmployeeSiteVisits(user.id).catch(() => []),
      fetchAllLeads().catch(() => []),
      fetchAllClients().catch(() => []),
      fetchMyScheduleActivities().catch(() => []),
    ])
      .then(([visitsList, leadList, clientList, scheduleList]) => {
        if (cancelled) return;
        
        const leadMap = new Map(leadList.map((l) => [String(l.id), l.clientName]));
        const clientMap = new Map(clientList.map((c) => [String(c.id), c.fullName]));

        const enriched = (visitsList || []).map((v) => {
          const projectName = v.locationDetails?.buildingName || leadMap.get(String(v.leadId)) || clientMap.get(String(v.leadId)) || `Lead/Client #${v.leadId}`;
          let status = "Scheduled";
          if (v.status === "COMPLETED") status = "Completed";
          else if (v.status === "CANCELLED") status = "Cancelled";

          const loc = v.locationDetails || {};
          const siteStr = [loc.buildingName, loc.addressLine1, loc.area, loc.city]
            .filter(Boolean)
            .join(", ") || "Location not specified";

          const formatTime = (t) => {
            if (!t) return "—";
            const [h, m] = t.split(":");
            const hr = parseInt(h, 10);
            const ampm = hr >= 12 ? "PM" : "AM";
            const displayHr = hr > 12 ? hr - 12 : hr || 12;
            return `${String(displayHr).padStart(2, "0")}:${m} ${ampm}`;
          };

          return {
            id: v.uuid || `v-${Math.random()}`,
            project: projectName,
            site: siteStr,
            date: v.scheduledDate || "",
            time: formatTime(v.scheduledTime),
            status: status,
            purpose: v.notes || "Site inspection",
          };
        });

        setVisits(enriched);
        setScheduleActivities(Array.isArray(scheduleList) ? scheduleList : []);
      })
      .catch((err) => {
        console.error("Failed to load employee site visits:", err);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const calendarEvents = useMemo(() => {
    const visitEvents = visits.map((v) => mapSiteVisitToCalendarEvent(v));
    const scheduleEvents = scheduleActivities.map((a) => mapScheduleActivityToCalendarEvent(a));
    return [...visitEvents, ...scheduleEvents];
  }, [visits, scheduleActivities]);

  const eventsByDate = useMemo(
    () => buildEventsByDate(calendarEvents, { expandMultiDay: true }),
    [calendarEvents]
  );

  const monthEvents = useMemo(
    () => calendarEvents.filter((e) => e.date?.startsWith(monthPrefix) || e.endDate?.startsWith(monthPrefix)),
    [calendarEvents, monthPrefix]
  );

  const upcoming = useMemo(() => {
    return calendarEvents
      .filter((e) => {
        if (e.type === "schedule_activity") {
          return String(e.endDate || e.date) >= today;
        }
        return e.date >= today && e.status === "Scheduled";
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);
  }, [calendarEvents, today]);

  const thisMonthEvents = useMemo(() => {
    return monthEvents.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [monthEvents]);

  return (
    <PageShell>
      <PageTitle
        title="My Calendar"
        subtitle="Site visits and assigned schedule activities. Click any event to view details."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <Surface className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="w-44 text-center font-display text-base font-semibold">{MONTHS[month - 1]} {year}</h2>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
            >
              Today
            </Button>
          </div>

          <div>
            <div className="grid grid-cols-7 border-b border-border/30">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((cell, idx) => {
                const cellEvents = cell.date ? (eventsByDate[cell.date] || []) : [];
                const isToday = cell.date === today;
                const MAX = 2;

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r border-border/25 p-1.5
                      ${cell.current ? "bg-transparent" : "bg-muted/10"}
                      ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
                    `}
                  >
                    <div className="mb-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                          ${isToday ? "bg-primary font-bold text-primary-foreground" : cell.current ? "text-foreground" : "text-muted-foreground/40"}
                        `}
                      >
                        {cell.day}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {cellEvents.slice(0, MAX).map((ev, i) => (
                        <button
                          key={`${ev.type}-${ev.id}-${i}`}
                          type="button"
                          onClick={() => setDetail(ev)}
                          className={`w-full rounded-md border px-1.5 py-0.5 text-left transition-opacity hover:opacity-75 ${
                            ev.type === "schedule_activity" ? SCHEDULE_PILL : PILL_COLOR[i % PILL_COLOR.length]
                          }`}
                        >
                          <p className="truncate text-[10px] font-semibold leading-tight flex items-center gap-0.5">
                            {ev.type === "schedule_activity" && <GanttChart className="h-2.5 w-2.5 shrink-0" />}
                            {(ev.title || ev.project || "Event").split(" ").slice(0, 2).join(" ")}
                          </p>
                          <p className="text-[9px] opacity-75">
                            {ev.type === "schedule_activity" ? `${ev.status}` : ev.time}
                          </p>
                        </button>
                      ))}
                      {cellEvents.length > MAX && (
                        <p className="pl-1 text-[9px] text-muted-foreground">+{cellEvents.length - MAX} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-border/30 px-5 py-3">
              {Object.entries(STATUS_DOT).map(([label, dot]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Schedule
              </span>
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming
            </p>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((ev) => (
                  <button
                    key={`${ev.type}-${ev.id}`}
                    type="button"
                    onClick={() => setDetail(ev)}
                    className="w-full space-y-1.5 rounded-xl bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold leading-tight">{ev.title || ev.project}</p>
                      <Badge className={`${ev.type === "schedule_activity" ? "bg-violet-500/15 text-violet-700" : STATUS_PILL[ev.status]} shrink-0 border-none text-[9px]`}>
                        {ev.type === "schedule_activity" ? "Schedule" : ev.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtDate(ev.date)}
                      {ev.type === "site_visit" ? ` · ${ev.time}` : ` → ${fmtDate(ev.endDate || ev.date)}`}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Surface>

          <Surface className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              This Month ({MONTHS[month - 1]})
            </p>
            {thisMonthEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No events this month.</p>
            ) : (
              <div className="space-y-2">
                {thisMonthEvents.map((ev) => (
                  <div
                    key={`${ev.type}-${ev.id}`}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2 transition-colors hover:bg-secondary/70"
                    onClick={() => setDetail(ev)}
                  >
                    <div>
                      <p className="text-xs font-medium">
                        {ev.date ? new Date(ev.date + "T00:00").getDate() : "—"} — {(ev.title || ev.project || "Event").split(" ").slice(0, 3).join(" ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ev.type === "schedule_activity" ? ev.status : ev.time}
                      </p>
                    </div>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      ev.type === "schedule_activity" ? "bg-violet-500" : STATUS_DOT[ev.status]
                    }`} />
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </div>

      {detail && (
        <Dialog open onOpenChange={() => setDetail(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                {detail.type === "schedule_activity" ? (
                  <><GanttChart className="h-4 w-4" /> Schedule Activity</>
                ) : (
                  "Site Visit Details"
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2.5 rounded-xl bg-secondary/40 p-4">
              {detail.type === "schedule_activity" ? (
                <>
                  {[
                    ["Activity", detail.title],
                    ["Project", detail.project],
                    ["Dates", `${fmtDate(detail.date)} → ${fmtDate(detail.endDate || detail.date)}`],
                    ["Progress", detail.status],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    ["Project",  detail.project],
                    ["Site",     detail.site],
                    ["Date",     fmtDate(detail.date)],
                    ["Time",     detail.time],
                    ["Purpose",  detail.purpose],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                  <Separator className="opacity-40" />
                  <div className="flex items-start gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">Status</span>
                    <Badge className={`${STATUS_PILL[detail.status]} border-none`}>{detail.status}</Badge>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              {detail.type === "schedule_activity" && (
                <Button asChild size="sm" variant="outline">
                  <Link to={ROUTES.EMPLOYEE.ACTIVITIES}>My activities</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}
