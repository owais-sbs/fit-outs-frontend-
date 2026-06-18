import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ── Mock visits for James Wu ──────────────────────────────────────────────────
function todayObj() { return new Date(); }

function ds(y, m, d) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

const t = todayObj();
const y = t.getFullYear();
const m = t.getMonth() + 1;

const MY_VISITS = [
  { id: "v1", project: "Luxury Penthouse Fit-Out", site: "Surry Hills, NSW",  date: ds(y, m, 3),  time: "09:00 AM", status: "Completed", purpose: "Pre-plasterboard inspection" },
  { id: "v2", project: "Moss Interiors Showroom",  site: "Surry Hills, NSW",  date: ds(y, m, 7),  time: "11:00 AM", status: "Completed", purpose: "Client material review" },
  { id: "v3", project: "Luxury Penthouse Fit-Out", site: "Sydney CBD, NSW",   date: ds(y, m, 12), time: "09:30 AM", status: "Scheduled", purpose: "Electrical inspection" },
  { id: "v4", project: "Moss Interiors Showroom",  site: "Surry Hills, NSW",  date: ds(y, m, 15), time: "02:00 PM", status: "Scheduled", purpose: "Design signoff walkthrough" },
  { id: "v5", project: "Luxury Penthouse Fit-Out", site: "Surry Hills, NSW",  date: ds(y, m, 18), time: "10:00 AM", status: "Scheduled", purpose: "Client progress update" },
  { id: "v6", project: "Luxury Penthouse Fit-Out", site: "Surry Hills, NSW",  date: ds(y, m, 22), time: "09:00 AM", status: "Scheduled", purpose: "Joinery final check" },
  { id: "v7", project: "Moss Interiors Showroom",  site: "Surry Hills, NSW",  date: ds(y, m, 25), time: "01:00 PM", status: "Scheduled", purpose: "Handover preparation" },
];

// ── Calendar helpers ──────────────────────────────────────────────────────────
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

export default function EmployeeCalendarPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [detail, setDetail] = useState(null);
  const today = todayStr();

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const visitsByDate = useMemo(() => {
    const map = {};
    MY_VISITS.forEach((v) => {
      if (!map[v.date]) map[v.date] = [];
      map[v.date].push(v);
    });
    return map;
  }, []);

  const upcoming = MY_VISITS.filter((v) => v.date >= today && v.status === "Scheduled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Calendar"
        description="Your site visit schedule. Click any event to view details."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* ── Calendar ────────────────────────────────────────────── */}
        <Card className="border-border/60 shadow-sm">
          {/* Nav */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold w-44 text-center">{MONTHS[month - 1]} {year}</h2>
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

          <CardContent className="p-0">
            {/* Day labels */}
            <div className="grid grid-cols-7 border-b border-border/50">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {grid.map((cell, idx) => {
                const cellVisits = cell.date ? (visitsByDate[cell.date] || []) : [];
                const isToday = cell.date === today;
                const MAX = 2;

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r border-border/40 p-1.5
                      ${cell.current ? "bg-background" : "bg-muted/10"}
                      ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
                    `}
                  >
                    {/* Day number */}
                    <div className="mb-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                          ${isToday ? "bg-primary text-primary-foreground font-bold" : cell.current ? "text-foreground" : "text-muted-foreground/40"}
                        `}
                      >
                        {cell.day}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="space-y-0.5">
                      {cellVisits.slice(0, MAX).map((v, i) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setDetail(v)}
                          className={`w-full rounded border px-1.5 py-0.5 text-left hover:opacity-75 transition-opacity ${PILL_COLOR[i % PILL_COLOR.length]}`}
                        >
                          <p className="truncate text-[10px] font-semibold leading-tight">
                            {v.project.split(" ").slice(0, 2).join(" ")}
                          </p>
                          <p className="text-[9px] opacity-75">{v.time}</p>
                        </button>
                      ))}
                      {cellVisits.length > MAX && (
                        <p className="pl-1 text-[9px] text-muted-foreground">+{cellVisits.length - MAX} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 border-t border-border/40 px-5 py-3">
              {Object.entries(STATUS_DOT).map(([label, dot]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Upcoming panel ───────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Upcoming Visits
              </p>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No upcoming visits.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setDetail(v)}
                      className="w-full text-left rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-tight">{v.project}</p>
                        <Badge className={`${STATUS_PILL[v.status]} text-[9px] shrink-0 border-none`}>
                          {v.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {fmtDate(v.date)} · {v.time}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {v.site}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All visits this month */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                This Month ({MONTHS[month - 1]})
              </p>
              {MY_VISITS.filter((v) => v.date.startsWith(`${year}-${String(month).padStart(2,"0")}`)).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No visits this month.</p>
              ) : (
                <div className="space-y-2">
                  {MY_VISITS
                    .filter((v) => v.date.startsWith(`${year}-${String(month).padStart(2,"0")}`))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setDetail(v)}
                      >
                        <div>
                          <p className="text-xs font-medium">{new Date(v.date + "T00:00").getDate()} — {v.project.split(" ").slice(0,3).join(" ")}</p>
                          <p className="text-[11px] text-muted-foreground">{v.time}</p>
                        </div>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[v.status]}`} />
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <Dialog open onOpenChange={() => setDetail(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                Site Visit Details
              </DialogTitle>
            </DialogHeader>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5">
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
              <Separator />
              <div className="flex items-start gap-3">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">Status</span>
                <Badge className={`${STATUS_PILL[detail.status]} border-none`}>{detail.status}</Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
