import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, MapPin, Search } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";

function VisitCard({ visit, upcoming }) {
  const initials = visit.assignee
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
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              {label}
            </Badge>
          ) : (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {visit.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(visit.date).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{visit.assignee}</span>
          </div>
          <Button variant="outline" size="sm" className="gap-1" asChild>
            <Link to={ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", visit.uuid)}>
              <FileText className="h-3 w-3" />
              Report
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SiteVisitsPage() {
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllSiteVisits(),
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
            : v.scheduledDate || v.createdAt;

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
        setCompleted(enriched.filter((v) => v.isCompleted));
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch site visits:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filter = (list) =>
    list.filter(
      (v) =>
        !search.trim() ||
        v.client.toLowerCase().includes(search.toLowerCase()) ||
        v.company.toLowerCase().includes(search.toLowerCase()) ||
        v.location.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site visits"
        description="Upcoming inspections and completed reports."
        actions={
          <Button asChild size="sm">
            <Link to={ROUTES.ADMIN.SITE_VISIT_SCHEDULE}>Schedule visit</Link>
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({filter(upcoming).length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filter(completed).length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            : filter(upcoming).length === 0
              ? <p className="col-span-3 py-12 text-center text-sm text-muted-foreground">No upcoming site visits.</p>
              : filter(upcoming).map((v) => <VisitCard key={v.uuid} visit={v} upcoming />)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))
            : filter(completed).length === 0
              ? <p className="col-span-3 py-12 text-center text-sm text-muted-foreground">No completed site visits.</p>
              : filter(completed).map((v) => <VisitCard key={v.uuid} visit={v} upcoming={false} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
