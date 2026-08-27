import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const PIE_COLORS = ["#3E7A6B", "#C8A97E", "#E07B39", "#5E9B8C", "#A8946E"];

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
        <Button asChild size="sm" variant="outline">
          <Link to={ROUTES.ADMIN.LEADS_LIST}>Open leads module</Link>
        </Button>
      </DashboardHeader>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total leads" value={loading ? "—" : leads.length} />
        <StatTile label="Open leads" value={loading ? "—" : openLeads.length} />
        <StatTile label="Site visits (month)" value={loading ? "—" : visitsThisMonth.length} />
        <StatTile label="Total visits" value={loading ? "—" : visits.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads by status</CardTitle></CardHeader>
          <CardContent className="h-64">
            {loading ? <Skeleton className="h-full w-full" /> : pieData.length > 0 ? (
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

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent leads</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to={ROUTES.ADMIN.LEADS_LIST}>View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 10).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <Link to={ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", l.id)} className="font-medium hover:underline">
                          {l.clientName}
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.statusLabel}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Site visits</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link to={ROUTES.ADMIN.SITE_VISITS}>Schedule & manage</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : visits.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No site visits scheduled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.slice(0, 12).map((v) => (
                  <TableRow key={v.uuid}>
                    <TableCell className="text-sm">
                      {v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString() : "—"}
                      {v.scheduledTime ? ` ${v.scheduledTime}` : ""}
                    </TableCell>
                    <TableCell><Badge variant="outline">{v.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.locationDetails?.city || v.locationDetails?.addressLine1 || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
