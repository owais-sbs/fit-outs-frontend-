import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Check, ChevronLeft, ChevronRight,
  MapPin, MoreHorizontal, Plus, Search, X,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import {
  CALENDAR_EMPLOYEES, CALENDAR_PROJECTS, CALENDAR_SITES,
  CALENDAR_VISITS, VISIT_STATUSES, getVisitsForMonth,
} from "../data/calendar";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllEmployees } from "../api/employees.api";
import { fetchAllLeads } from "../api/leads.api";
import { fetchAllClients } from "../api/clients.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_VARIANT = {
  Scheduled: "warning",
  Completed: "success",
  Cancelled: "destructive",
};

const STATUS_DOT = {
  Scheduled: "bg-amber-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-destructive",
};

// Calendar event pill colours — rotate by employee index
const EVENT_COLORS = [
  "bg-primary/15 text-primary border-primary/20",
  "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  "bg-violet-500/15 text-violet-700 border-violet-500/20",
  "bg-amber-500/15 text-amber-700 border-amber-500/20",
  "bg-rose-500/15 text-rose-700 border-rose-500/20",
  "bg-sky-500/15 text-sky-700 border-sky-500/20",
  "bg-teal-500/15 text-teal-700 border-teal-500/20",
  "bg-orange-500/15 text-orange-700 border-orange-500/20",
];

function eventColor(employeeName) {
  const idx = CALENDAR_EMPLOYEES.indexOf(employeeName);
  return EVENT_COLORS[(idx >= 0 ? idx : 0) % EVENT_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}

function buildCalendarGrid(year, month) {
  // month is 1-based
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();

  const cells = [];
  // Leading cells from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false, date: null });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ day: d, current: true, date: dateStr });
  }
  // Trailing cells
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, date: null });
  }
  return cells;
}

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────
function EventModal({ visit, onClose, onEdit }) {
  if (!visit) return null;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Site Visit Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5">
            <Row label="Employee"    value={visit.employee} />
            <Row label="Project"     value={visit.project} />
            <Row label="Site"        value={visit.site} />
            <Row label="Date"        value={fmtDate(visit.date)} />
            <Row label="Time"        value={formatTime(visit.time)} />
            <Row label="Assigned By" value={visit.assignedBy} />
            {visit.remarks && <Row label="Remarks" value={visit.remarks} />}
            <div className="flex items-start gap-4 pt-0.5">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">Status</span>
              <Badge variant={STATUS_VARIANT[visit.status]}>{visit.status}</Badge>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={() => onEdit(visit)}>Edit Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium leading-snug">{value}</span>
    </div>
  );
}

// ─── Schedule Form Modal ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  employee: "", project: "", site: "", date: "", time: "", remarks: "", status: "Scheduled",
};

function ScheduleModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!initial?.id;

  const valid = form.employee && form.project && form.site && form.date && form.time;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Schedule" : "Schedule Site Visit"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Employee <span className="text-destructive">*</span></Label>
            <Select value={form.employee} onValueChange={(v) => set("employee", v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {CALENDAR_EMPLOYEES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Project <span className="text-destructive">*</span></Label>
            <Select value={form.project} onValueChange={(v) => set("project", v)}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {CALENDAR_PROJECTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Site <span className="text-destructive">*</span></Label>
            <Select value={form.site} onValueChange={(v) => set("site", v)}>
              <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
              <SelectContent>
                {CALENDAR_SITES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Visit Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Visit Time <span className="text-destructive">*</span></Label>
            <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Remarks</Label>
            <Input
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!valid} onClick={() => onSave(form)}>
            {isEdit ? "Save Changes" : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function enrichVisits(visitsList, empList, leadList, clientList) {
  const empMap = new Map(empList.map((e) => [String(e.id), e.employeeName || e.fullName]));
  const leadMap = new Map(leadList.map((l) => [String(l.id), l.clientName]));
  const clientMap = new Map(clientList.map((c) => [String(c.id), c.fullName]));

  return (visitsList || []).map((v) => {
    let empName = "Unassigned";
    if (Array.isArray(v.employeeNames) && v.employeeNames.length > 0) {
      empName = v.employeeNames.filter(Boolean).join(", ");
    } else if (Array.isArray(v.employeeIds) && v.employeeIds.length > 0) {
      empName = v.employeeIds.map(id => empMap.get(String(id)) || `Employee #${id}`).join(", ");
    } else if (v.assignedTo) {
      empName = empMap.get(String(v.assignedTo)) || `Employee #${v.assignedTo}`;
    }
    const projectName = v.locationDetails?.buildingName || leadMap.get(String(v.leadId)) || clientMap.get(String(v.leadId)) || `Lead/Client #${v.leadId}`;
    
    let status = "Scheduled";
    if (v.status === "COMPLETED") status = "Completed";
    else if (v.status === "CANCELLED") status = "Cancelled";

    const loc = v.locationDetails || {};
    const siteStr = [loc.buildingName, loc.addressLine1, loc.area, loc.city]
      .filter(Boolean)
      .join(", ") || "Location not specified";

    return {
      id: v.uuid || `v-${Math.random()}`,
      employee: empName,
      project: projectName,
      site: siteStr,
      date: v.scheduledDate || "",
      time: v.scheduledTime || "",
      status: status,
      assignedBy: "Admin",
      remarks: v.notes || "",
    };
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllSiteVisits().catch(() => []),
      fetchAllEmployees().catch(() => []),
      fetchAllLeads().catch(() => []),
      fetchAllClients().catch(() => []),
    ])
      .then(([visitsList, empList, leadList, clientList]) => {
        if (cancelled) return;
        const enriched = enrichVisits(visitsList, empList, leadList, clientList);
        setVisits(enriched);
      })
      .catch((err) => {
        console.error("Failed to fetch calendar data:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Filters
  const [search,   setSearch]   = useState("");
  const [projFilt, setProjFilt] = useState("all");
  const [statFilt, setStatFilt] = useState("all");
  const [dateFilt, setDateFilt] = useState("");

  // Modals
  const [detailVisit,   setDetailVisit]   = useState(null);
  const [scheduleForm,  setScheduleForm]  = useState(null); // null=closed, {}=new, {id}=edit
  const [showForm,      setShowForm]      = useState(false);

  const today = todayStr();

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const todayVisits  = visits.filter((v) => v.date === today);
    const upcoming     = visits.filter((v) => v.date > today && v.status === "Scheduled");
    const scheduled    = visits.filter((v) => v.status === "Scheduled");
    const empToday     = new Set(todayVisits.map((v) => v.employee)).size;
    return { todayCount: todayVisits.length, upcomingCount: upcoming.length, scheduledCount: scheduled.length, empToday };
  }, [visits, today]);

  // ── Filtered table list ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visits.filter((v) => {
      const mQ    = !q || v.employee.toLowerCase().includes(q) || v.project.toLowerCase().includes(q) || v.site.toLowerCase().includes(q);
      const mProj = projFilt === "all" || v.project === projFilt;
      const mStat = statFilt === "all" || v.status === statFilt;
      const mDate = !dateFilt || v.date === dateFilt;
      return mQ && mProj && mStat && mDate;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [visits, search, projFilt, statFilt, dateFilt]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const monthVisits = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return visits.filter((v) => v.date?.startsWith(prefix));
  }, [visits, year, month]);

  // Map date → visits for O(1) lookup
  const visitsByDate = useMemo(() => {
    const map = {};
    monthVisits.forEach((v) => {
      if (!map[v.date]) map[v.date] = [];
      map[v.date].push(v);
    });
    return map;
  }, [monthVisits]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSave = (form) => {
    if (form.id) {
      setVisits((prev) => prev.map((v) => v.id === form.id ? { ...v, ...form } : v));
    } else {
      setVisits((prev) => [...prev, { ...form, id: `cv-${Date.now()}`, assignedBy: "Admin" }]);
    }
    setShowForm(false);
    setScheduleForm(null);
  };

  const handleDelete = (id) => setVisits((prev) => prev.filter((v) => v.id !== id));
  const handleEdit   = (visit) => { setDetailVisit(null); setScheduleForm(visit); setShowForm(true); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Manage employee site visit schedules."
        actions={
          <Button size="sm" className="gap-2" onClick={() => { setScheduleForm(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" />
            Schedule Site Visit
          </Button>
        }
      />

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Site Visits"    value={stats.todayCount}    icon={CalendarDays} growth={0} growthLabel="today" />
        <StatCard title="Upcoming Visits"         value={stats.upcomingCount} icon={ChevronRight}  growth={5} growthLabel="vs last month" />
        <StatCard title="Total Scheduled"         value={stats.scheduledCount}icon={Check}         growth={8} growthLabel="vs last month" />
        <StatCard title="Employees Assigned Today"value={stats.empToday}      icon={MapPin}        growth={0} growthLabel="today" />
      </section>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee, project, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={projFilt} onValueChange={setProjFilt}>
                <SelectTrigger className="w-[185px]"><SelectValue placeholder="All projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {CALENDAR_PROJECTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statFilt} onValueChange={setStatFilt}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {VISIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilt}
                onChange={(e) => setDateFilt(e.target.value)}
                className="w-[145px]"
              />
              {(search || projFilt !== "all" || statFilt !== "all" || dateFilt) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  onClick={() => { setSearch(""); setProjFilt("all"); setStatFilt("all"); setDateFilt(""); }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Schedule table ────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold">
            Site Visit Schedule
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({filtered.length} visit{filtered.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-auto max-h-72">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/70 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                    No visits match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((v) => (
                  <TableRow
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => setDetailVisit(v)}
                  >
                    <TableCell className="pl-5 font-medium whitespace-nowrap">
                      <span className={v.date === today ? "text-primary font-semibold" : ""}>
                        {fmtDate(v.date)}
                        {v.date === today && (
                          <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                            TODAY
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{v.employee}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{v.project}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.site}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatTime(v.time)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[v.status]}`} />
                        <Badge variant={STATUS_VARIANT[v.status]} className="text-xs">{v.status}</Badge>
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setDetailVisit(v)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(v)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(v.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ── Monthly Calendar ──────────────────────────────────────────────── */}
      <Card className="border-border/60 shadow-sm">
        {/* Calendar header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold min-w-[160px] text-center">
              {MONTHS[month - 1]} {year}
            </h2>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
            Today
          </Button>
        </div>

        <CardContent className="p-0">
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {grid.map((cell, idx) => {
              const cellVisits = cell.date ? (visitsByDate[cell.date] || []) : [];
              const isToday = cell.date === today;
              const MAX_SHOW = 3;
              const extra = cellVisits.length - MAX_SHOW;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] border-b border-r border-border/40 p-1.5 last:border-r-0 transition-colors
                    ${cell.current ? "bg-background" : "bg-muted/10"}
                    ${cell.current ? "hover:bg-muted/20" : ""}
                    ${(idx + 1) % 7 === 0 ? "border-r-0" : ""}
                  `}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                        ${isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : cell.current
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                        }`}
                    >
                      {cell.day}
                    </span>
                    {cell.current && cellVisits.length > 0 && (
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {cellVisits.length}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {cellVisits.slice(0, MAX_SHOW).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setDetailVisit(v)}
                        className={`w-full rounded border px-1.5 py-0.5 text-left transition-opacity hover:opacity-80 ${eventColor(v.employee)}`}
                      >
                        <p className="truncate text-[10px] font-semibold leading-tight">
                          {v.employee.split(" ")[0]}
                        </p>
                        <p className="truncate text-[9px] leading-tight opacity-80">
                          {v.project.split(" ").slice(0, 3).join(" ")}
                        </p>
                      </button>
                    ))}
                    {extra > 0 && (
                      <p className="pl-1 text-[9px] font-medium text-muted-foreground">
                        +{extra} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border/40 px-5 py-3">
            {Object.entries(STATUS_DOT).map(([label, dot]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground">
              Click any event to view details
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Event detail modal ────────────────────────────────────────────── */}
      {detailVisit && (
        <EventModal
          visit={detailVisit}
          onClose={() => setDetailVisit(null)}
          onEdit={handleEdit}
        />
      )}

      {/* ── Schedule form modal ───────────────────────────────────────────── */}
      {showForm && (
        <ScheduleModal
          initial={scheduleForm}
          onClose={() => { setShowForm(false); setScheduleForm(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
