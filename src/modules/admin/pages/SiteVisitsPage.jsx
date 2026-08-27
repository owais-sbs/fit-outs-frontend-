import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  CalendarClock,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";
import {
  enrichSiteVisits,
  formatCountdownLabel,
  formatVisitSchedule,
  isAbortError,
  sortVisitsLatestFirst,
} from "../utils/siteVisitListUtils";
import { useSiteVisitPortalRoutes } from "@/shared/hooks/use-site-visit-portal-routes";
import VisitReportsPage from "./VisitReportsPage";
import ChecklistsPage from "./ChecklistsPage";
import { cn } from "@/lib/utils";

function visitStatusVariant(status = "") {
  const s = String(status).toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "IN_PROGRESS") return "default";
  if (s === "CANCELLED" || s === "CANCELED") return "destructive";
  return "warning";
}

function visitStatusLabel(status = "") {
  const s = String(status || "SCHEDULED").toUpperCase();
  return s
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function VisitCard({ visit, upcoming, reportHref }) {
  const initials = visit.assignee
    ? visit.assignee
        .split(",")[0]
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  const { dateLabel, timeLabel } = formatVisitSchedule(visit.date);
  const countdown = formatCountdownLabel(visit.countdownHours, upcoming);
  const unassigned = visit.assignee === "Unassigned";

  return (
    <Card className="group overflow-hidden border border-border bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/15 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">{visit.client}</p>
            <p className="truncate text-sm text-muted-foreground">{visit.company}</p>
          </div>
          <Badge variant={upcoming ? visitStatusVariant(visit.status) : "success"} className="shrink-0 gap-1">
            {upcoming ? <Clock className="h-3 w-3" /> : null}
            {upcoming ? countdown : "Completed"}
          </Badge>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{dateLabel}</p>
              {timeLabel ? <p className="text-xs text-muted-foreground">{timeLabel}</p> : null}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{visit.location}</p>
          </div>

          {visit.status && upcoming ? (
            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
              {visitStatusLabel(visit.status)}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className={cn("h-7 w-7 border border-border/60", unassigned && "opacity-70")}>
              <AvatarFallback
                className={cn(
                  "text-[10px] font-semibold",
                  unassigned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {unassigned ? "Unassigned" : visit.assignee.split(",")[0].trim()}
              </p>
              {!unassigned && visit.assignee.includes(",") ? (
                <p className="truncate text-[10px] text-muted-foreground">+ more assigned</p>
              ) : null}
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5 group-hover:border-primary/40" asChild>
            <Link to={reportHref}>
              <FileText className="h-3.5 w-3.5" />
              Report
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VisitCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border">
      <CardContent className="p-0 space-y-0">
        <div className="border-b border-border/60 px-4 py-3.5 space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3 px-4 py-3.5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function VisitGrid({ loading, visits, upcoming, reportHrefBuilder, emptyMessage }) {
  if (loading) {
    return (
      <>
        {Array.from({ length: 6 }).map((_, i) => (
          <VisitCardSkeleton key={i} />
        ))}
      </>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/10 px-6 py-14 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium text-foreground">{emptyMessage}</p>
        <p className="mt-1 text-xs text-muted-foreground">Try adjusting your search or schedule a new visit.</p>
      </div>
    );
  }

  return visits.map((v) => (
    <VisitCard
      key={v.uuid}
      visit={v}
      upcoming={upcoming}
      reportHref={reportHrefBuilder(v.uuid)}
    />
  ));
}

export default function SiteVisitsPage() {
  const portal = useSiteVisitPortalRoutes();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "upcoming";
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [visits, leads] = await Promise.all([
          fetchAllSiteVisits(),
          fetchAllLeads().catch(() => []),
        ]);
        if (ignore) return;
        const enriched = sortVisitsLatestFirst(enrichSiteVisits(visits, leads));
        setUpcoming(enriched.filter((v) => !v.isCompleted && !v.isCancelled));
        setCompleted(enriched.filter((v) => v.isCompleted));
      } catch (err) {
        if (ignore || isAbortError(err)) return;
        console.error("Failed to fetch site visits:", err);
        setError(err?.response?.data?.message || err.message || "Failed to load site visits");
        setUpcoming([]);
        setCompleted([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const filterAndSort = useCallback((list) => {
    const q = search.trim().toLowerCase();
    const filtered = list.filter(
      (v) =>
        !q ||
        v.client.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        v.assignee.toLowerCase().includes(q)
    );
    return sortVisitsLatestFirst(filtered);
  }, [search]);

  const filteredUpcoming = useMemo(() => filterAndSort(upcoming), [upcoming, filterAndSort]);
  const filteredCompleted = useMemo(() => filterAndSort(completed), [completed, filterAndSort]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = upcoming.filter((v) => {
      const ms = new Date(v.date).getTime();
      return Number.isFinite(ms) && ms >= now && ms <= now + weekMs;
    }).length;
    const unassigned = upcoming.filter((v) => v.assignee === "Unassigned").length;
    return {
      upcoming: upcoming.length,
      thisWeek,
      unassigned,
    };
  }, [upcoming]);

  const setTab = (value) => {
    if (value === "upcoming") {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  const reportHref = (uuid) => portal.report.replace(":visitId", uuid);

  return (
    <PageShell>
      <PageHeader
        title="Site visits"
        description="Schedule inspections, track visits, and access reports."
        actions={
          portal.canSchedule && portal.schedule ? (
            <Button asChild size="sm">
              <Link to={portal.schedule}>Schedule visit</Link>
            </Button>
          ) : null
        }
      />

      {(tab === "upcoming" || tab === "completed") && !loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Upcoming" value={stats.upcoming} icon={CalendarClock} />
          <SummaryTile label="This week" value={stats.thisWeek} icon={Calendar} />
          <SummaryTile label="Unassigned" value={stats.unassigned} icon={UserRound} />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1 sm:w-auto">
            <TabsTrigger value="upcoming" className="rounded-lg">
              Upcoming ({filteredUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg">
              Completed ({filteredCompleted.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg">
              Reports
            </TabsTrigger>
            <TabsTrigger value="checklists" className="rounded-lg">
              Checklists
            </TabsTrigger>
          </TabsList>

          {(tab === "upcoming" || tab === "completed") && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search client, location, assignee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          )}
        </div>

        <TabsContent value="upcoming" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <VisitGrid
            loading={loading}
            visits={filteredUpcoming}
            upcoming
            reportHrefBuilder={reportHref}
            emptyMessage="No upcoming site visits"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <VisitGrid
            loading={loading}
            visits={filteredCompleted}
            upcoming={false}
            reportHrefBuilder={reportHref}
            emptyMessage="No completed site visits"
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <VisitReportsPage embedded />
        </TabsContent>

        <TabsContent value="checklists" className="mt-4">
          <ChecklistsPage embedded />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
