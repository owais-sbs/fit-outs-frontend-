import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Download, Eye, FileText } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell, SearchInput } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllLeads } from "../api/leads.api";

function ReportCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border">
      <CardContent className="space-y-0 p-0">
        <div className="space-y-2 border-b border-border/60 px-4 py-3.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3 px-4 py-3.5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function VisitReportsPage({ embedded = false }) {
  const [reports, setReports] = useState([]);
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
        const completedVisits = visits.filter((v) => v.status === "COMPLETED");

        const enriched = completedVisits.map((v) => {
          const lead = leadMap.get(String(v.leadId));
          const dateTime =
            v.scheduledDate && v.scheduledTime
              ? `${v.scheduledDate}T${v.scheduledTime}`
              : v.scheduledDate || v.createdAt || new Date().toISOString();

          return {
            id: v.uuid || v.id,
            client: lead?.clientName || `Lead #${v.leadId}`,
            company: lead?.company || "—",
            date: dateTime,
            assignee: v.assignedTo ? `Employee #${v.assignedTo}` : "Unassigned",
            status: "Generated",
          };
        });

        setReports(enriched);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to fetch reports:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = reports.filter(
    (r) =>
      !search.trim() ||
      r.client.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase())
  );

  const body = (
    <>
      {!embedded && (
        <PageHeader
          title="Visit Reports"
          description="Access and download generated site inspection reports."
        />
      )}

      {embedded ? (
        <div className="relative mb-4 max-w-sm">
          <SearchInput
            placeholder="Search reports by client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      ) : (
        <SearchInput
          placeholder="Search reports by client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ReportCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/10 px-6 py-14 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">No reports found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed visits with reports will appear here.
            </p>
          </div>
        ) : (
          filtered.map((report) => {
            const unassigned = report.assignee === "Unassigned";
            const initials = unassigned
              ? "—"
              : report.assignee
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
            const dateLabel = new Date(report.date).toLocaleDateString("en-AU", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const reportHref = ROUTES.ADMIN.SITE_VISIT_REPORT.replace(":visitId", report.id);

            return (
              <Card
                key={report.id}
                className="group overflow-hidden border border-border bg-card shadow-sm transition-all hover:border-primary/35 hover:shadow-md"
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/15 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">{report.client}</p>
                      <p className="truncate text-sm text-muted-foreground">{report.company}</p>
                    </div>
                    <Badge className="shrink-0 border-[#C9A96E]/35 bg-[#C9A96E]/15 text-[#8a6d3b] dark:text-[#d9be8a]">
                      {report.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{dateLabel}</p>
                        <p className="text-xs text-muted-foreground">Inspection date</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border border-border/60">
                        <AvatarFallback
                          className={`text-[10px] font-semibold ${
                            unassigned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                          }`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{report.assignee}</p>
                        <p className="text-[10px] text-muted-foreground">Inspector</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 bg-muted/10 px-4 py-3">
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link to={reportHref}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link to={`${reportHref}?step=cover`}>
                        <Download className="h-3.5 w-3.5" />
                        Draft BoQ
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );

  if (embedded) return body;
  return <PageShell>{body}</PageShell>;
}
