import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, MapPin, Search } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";

export function VisitCard({ visit, upcoming }) {
  const initials = visit.assignee && visit.assignee !== "Unassigned"
    ? visit.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const hours = visit.countdownHours ?? 0;
  const label = hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;

  return (
    <Card className="border-border/60 transition-all hover:border-primary/25 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{visit.client}</p>
            <p className="text-sm text-muted-foreground">{visit.company}</p>
          </div>
          {upcoming ? (
            <Badge variant="warning" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3" />
              {label}
            </Badge>
          ) : (
            <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>
          )}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary/70" />
          <span className="line-clamp-1">{visit.location}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary/70" />
          {new Date(visit.date).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{visit.assignee}</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" asChild>
            <Link to={ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", visit.uuid || visit.id)}>
              <FileText className="h-3 w-3" />
              Report
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UpcomingVisitsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllSiteVisits().catch(() => []),
      fetchAllLeads().catch(() => []),
    ])
      .then(([visits, leads]) => {
        if (cancelled) return;
        const leadMap = new Map(leads.map((l) => [String(l.id), l]));
        const enriched = visits.map((v) => {
          const lead = leadMap.get(String(v.leadId));
          const loc = v.locationDetails || {};
          const locationStr = [loc.addressLine1, loc.buildingName, loc.area, loc.city, loc.state]
            .filter(Boolean)
            .join(", ") || "Location not specified";

          const dateTime = v.scheduledDate && v.scheduledTime
            ? `${v.scheduledDate}T${v.scheduledTime}`
            : v.scheduledDate || v.createdAt || new Date().toISOString();

          const scheduledMs = new Date(dateTime).getTime();
          const countdownHours = Math.max(0, Math.round((scheduledMs - Date.now()) / 3_600_000));
          const isCompleted = v.status === "COMPLETED";

          return {
            ...v,
            client: lead?.clientName || `Lead #${v.leadId}`,
            company: lead?.company || loc.buildingName || loc.area || "—",
            date: dateTime,
            location: locationStr,
            assignee: (Array.isArray(v.employeeIds) && v.employeeIds.length > 0)
              ? v.employeeIds.map((id) => `Employee #${id}`).join(", ")
              : (v.assignedTo ? `Employee #${v.assignedTo}` : "Unassigned"),
            isCompleted,
            countdownHours,
          };
        });

        setUpcoming(enriched.filter((v) => !v.isCompleted));
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch site visits:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = upcoming.filter(
    (v) =>
      !search.trim() ||
      v.client.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Visits"
        description="View and manage all scheduled site visits."
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>Schedule visit</Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search upcoming visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-32 mb-4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between mt-6 pt-4 border-t">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))
          : filtered.length === 0
            ? <div className="col-span-full py-16 flex flex-col items-center text-center bg-muted/20 border border-border/50 rounded-xl">
                <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-medium text-lg">No upcoming visits</h3>
                <p className="text-muted-foreground max-w-sm mt-1">There are no scheduled site visits matching your current criteria.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>Schedule a Visit</Link>
                </Button>
              </div>
            : filtered.map((v) => <VisitCard key={v.uuid || v.id} visit={v} upcoming />)}
      </div>
    </div>
  );
}
