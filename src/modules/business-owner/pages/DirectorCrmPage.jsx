import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  EvilPieChart, Pie, Legend, Tooltip,
} from "@/components/evilcharts/charts/pie-chart";
import { ROUTES } from "@/shared/constants/routes";
import { fetchAllLeads } from "@/modules/admin/api/leads.api";
import { fetchAllSiteVisits } from "@/modules/admin/api/site-visits.api";
import { leadsByStatusPie, isThisMonth } from "../utils/directorDashboardUtils";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#0a1628", "#C9A96E", "#8a6d3b", "#3F3F46", "#d9be8a"];

const btnPrimary =
  "gap-1.5 border-0 bg-[#0a1628] text-[#FAF7F2] hover:bg-[#081729] hover:text-[#FAF7F2]";
const btnGhost =
  "gap-1.5 text-muted-foreground hover:bg-[#C9A96E]/12 hover:text-[#8a6d3b]";

function formatVisitDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatVisitTime(time) {
  if (!time) return "";
  const raw = String(time).trim();
  if (!raw) return "";
  // Keep HH:mm if already short; otherwise try parse
  if (/^\d{1,2}:\d{2}/.test(raw)) return raw.slice(0, 5);
  return raw;
}

function VisitStatusBadge({ status }) {
  const key = String(status || "").toUpperCase();
  const styles =
    key === "COMPLETED"
      ? "border-[#C9A96E]/40 bg-[#C9A96E]/15 text-[#8a6d3b]"
      : key === "SCHEDULED" || key === "PLANNED"
        ? "border-[#0a1628]/15 bg-[#0a1628]/8 text-[#0a1628]"
        : "border-border bg-muted/40 text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles)}>
      {status || "—"}
    </Badge>
  );
}

export default function DirectorCrmPage() {
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAllLeads(), fetchAllSiteVisits()])
      .then(([l, v]) => {
        setLeads(l);
        setVisits(v);
      })
      .catch(() => {
        setLeads([]);
        setVisits([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pieData = leadsByStatusPie(leads);
  const pieConfig = pieData.reduce((acc, item, i) => {
    acc[item.name] = {
      label: item.name,
      colors: { light: [PIE_COLORS[i % PIE_COLORS.length]], dark: [PIE_COLORS[i % PIE_COLORS.length]] },
    };
    return acc;
  }, {});

  const visitsThisMonth = visits.filter((v) => isThisMonth(v.scheduledDate));
  const openLeads = leads.filter((l) => !["LOST", "Lost"].includes(l.status));

  return (
    <PageShell>
      <DashboardHeader
        title="CRM & Pipeline"
        description="Lead pipeline snapshot and site visit activity."
      >
        <Button asChild size="sm" className={btnPrimary}>
          <Link to={ROUTES.ADMIN.LEADS_LIST}>
            <Users className="h-3.5 w-3.5" />
            Open leads
          </Link>
        </Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total leads" value={loading ? "—" : leads.length} icon={Users} />
        <StatTile label="Open leads" value={loading ? "—" : openLeads.length} icon={Users} />
        <StatTile label="Site visits (month)" value={loading ? "—" : visitsThisMonth.length} icon={CalendarDays} />
        <StatTile label="Total visits" value={loading ? "—" : visits.length} icon={MapPin} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Leads by status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : pieData.length > 0 ? (
              <EvilPieChart data={pieData} config={pieConfig} nameKey="name" dataKey="value" className="h-full w-full">
                <Pie dataKey="value" nameKey="name" />
                <Tooltip />
                <Legend />
              </EvilPieChart>
            ) : (
              <p className="text-sm text-muted-foreground">No leads data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Recent leads</CardTitle>
            <Button asChild size="sm" variant="ghost" className={btnGhost}>
              <Link to={ROUTES.ADMIN.LEADS_LIST}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/70 hover:bg-transparent">
                    <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Client
                    </TableHead>
                    <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Source
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 10).map((l) => (
                    <TableRow key={l.id} className="border-border/60">
                      <TableCell>
                        <Link
                          to={ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", l.id)}
                          className="font-medium text-foreground transition-colors hover:text-[#8a6d3b]"
                        >
                          {l.clientName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-sm border-[#0a1628]/15 text-[10px] font-semibold uppercase tracking-wide">
                          {l.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.source || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Site visits</CardTitle>
          <Button asChild size="sm" variant="ghost" className={btnGhost}>
            <Link to={ROUTES.ADMIN.SITE_VISITS}>
              Schedule & manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No site visits scheduled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/70 hover:bg-transparent">
                  <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </TableHead>
                  <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Time
                  </TableHead>
                  <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-10 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Location
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.slice(0, 12).map((v) => {
                  const time = formatVisitTime(v.scheduledTime);
                  return (
                    <TableRow key={v.uuid} className="border-border/60">
                      <TableCell className="text-sm font-medium tabular-nums">
                        {formatVisitDate(v.scheduledDate)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {time || "—"}
                      </TableCell>
                      <TableCell>
                        <VisitStatusBadge status={v.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C9A96E]" strokeWidth={1.75} />
                          {v.locationDetails?.city || v.locationDetails?.addressLine1 || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
