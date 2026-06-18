import { useEffect, useState } from "react";
import { CheckCircle, Search } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";
import { VisitCard } from "./UpcomingVisitsPage";

export default function CompletedVisitsPage() {
  const [completed, setCompleted] = useState([]);
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

          return {
            ...v,
            client: lead?.clientName || `Lead #${v.leadId}`,
            company: lead?.company || loc.buildingName || loc.area || "—",
            date: dateTime,
            location: locationStr,
            assignee: (Array.isArray(v.employeeIds) && v.employeeIds.length > 0)
              ? v.employeeIds.map((id) => `Employee #${id}`).join(", ")
              : (v.assignedTo ? `Employee #${v.assignedTo}` : "Unassigned"),
            isCompleted: v.status === "COMPLETED",
          };
        });

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

  const filtered = completed.filter(
    (v) =>
      !search.trim() ||
      v.client.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Visits"
        description="Review past site visits and access their reports."
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search completed visits..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30" />
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
                <CheckCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-medium text-lg">No completed visits</h3>
                <p className="text-muted-foreground max-w-sm mt-1">There are no completed site visits matching your current criteria.</p>
              </div>
            : filtered.map((v) => <VisitCard key={v.uuid || v.id} visit={v} upcoming={false} />)}
      </div>
    </div>
  );
}
