import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, DollarSign, Target, Trophy,
  TrendingUp, MapPin, Download, RefreshCw, Loader2,
} from "lucide-react";
import DashboardHeader from "../../super-admin/components/DashboardHeader";
import AnalyticsToolbar from "@/modules/shared/components/AnalyticsToolbar";
import AnalyticsChartCard from "@/modules/super-admin/components/dashboard/AnalyticsChartCard";
import DashboardSection from "@/modules/super-admin/components/dashboard/DashboardSection";
import { PageShell, StatTile } from "@/components/layout/PageShell";
import {
  EvilLineChart, Line, XAxis, Legend, Tooltip,
} from "@/components/evilcharts/charts/line-chart";
import {
  EvilPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip,
} from "@/components/evilcharts/charts/pie-chart";
import {
  EvilBarChart, Bar, Grid, XAxis as BarXAxis, Legend as BarLegend, Tooltip as BarTooltip,
} from "@/components/evilcharts/charts/bar-chart";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchAllLeads } from "../api/leads.api";
import { fetchAllProjects } from "../api/projects.api";
import { fetchAllSiteVisits } from "../api/site-visits.api";
import { fetchAllEmployees } from "../api/employees.api";
import { buildAdminDashboardAnalytics } from "../utils/buildAdminDashboardAnalytics";

const EXTENDED_ICONS = {
  pipeline: BarChart3,
  won: Trophy,
  lost: Target,
  conversion: TrendingUp,
  revenue: DollarSign,
  visits: MapPin,
};

const STATUS_VARIANT = {
  "on-track": "success",
  "at-risk": "warning",
  pending: "secondary",
};

function defaultDateRange(period = "30d") {
  const to = new Date();
  const from = new Date();
  if (period === "7d") from.setDate(from.getDate() - 6);
  else if (period === "90d") from.setDate(from.getDate() - 89);
  else if (period === "12m") from.setMonth(from.getMonth() - 11);
  else if (period === "ytd") from.setMonth(0, 1);
  else from.setDate(from.getDate() - 29);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function exportCsv(analytics) {
  const rows = [
    ["Metric", "Value", "Change"],
    ...analytics.kpis.map((k) => [k.title, k.value, `${k.growth}% ${k.growthLabel}`]),
    [],
    ["Month", "Leads created"],
    ...analytics.pipelinePerfData.map((r) => [r.month, r.value]),
    [],
    ["Source", "Count"],
    ...analytics.leadSourceData.map((r) => [r.source, r.count]),
    [],
    ["Month", "Won", "Lost"],
    ...analytics.wonLostData.map((r) => [r.month, r.won, r.lost]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const initial = defaultDateRange("30d");
  const [period, setPeriod] = useState("30d");
  const [assignee, setAssignee] = useState("all");
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);

  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [siteVisits, setSiteVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [leadData, projectData, visitData, employeeData] = await Promise.all([
        fetchAllLeads(0, 500),
        fetchAllProjects(),
        fetchAllSiteVisits(),
        fetchAllEmployees().catch(() => []),
      ]);
      setLeads(leadData || []);
      setProjects(projectData || []);
      setSiteVisits(visitData || []);
      setEmployees(employeeData || []);
      setRefreshedAt(new Date());
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePeriodChange = (next) => {
    setPeriod(next);
    const range = defaultDateRange(next);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const analytics = useMemo(
    () =>
      buildAdminDashboardAnalytics({
        leads,
        projects,
        siteVisits,
        period,
        dateFrom,
        dateTo,
        assigneeId: assignee,
      }),
    [leads, projects, siteVisits, period, dateFrom, dateTo, assignee]
  );

  const emptyCharts =
    !loading &&
    !error &&
    analytics.meta.leadCount === 0 &&
    projects.length === 0 &&
    siteVisits.length === 0;

  return (
    <PageShell className="space-y-8">
      <DashboardHeader
        title="Admin Dashboard"
        description="Live CRM analytics from leads, projects, and site visits."
      >
        <div className="flex items-center gap-2">
          {refreshedAt && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated {refreshedAt.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => exportCsv(analytics)}
            disabled={loading || emptyCharts}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </DashboardHeader>

      <AnalyticsToolbar
        period={period}
        onPeriodChange={handlePeriodChange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExport={() => exportCsv(analytics)}
        filterSlot={
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.employeeName || emp.fullName || emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/60 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading live dashboard…
        </div>
      )}

      {!loading && emptyCharts && (
        <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-12 text-center text-sm text-muted-foreground">
          No leads, projects, or site visits found for this company yet.
        </div>
      )}

      {!loading && !emptyCharts && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {analytics.kpis.map((kpi) => {
              const Icon = EXTENDED_ICONS[kpi.id];
              const isPos = kpi.growth >= 0;
              return (
                <StatTile
                  key={kpi.id}
                  label={kpi.title}
                  value={kpi.value}
                  icon={Icon}
                  hint={`${isPos ? "+" : ""}${kpi.growth}% ${kpi.growthLabel}`}
                />
              );
            })}
          </div>

          <DashboardSection gridClassName="lg:grid-cols-2">
            <AnalyticsChartCard
              title="Leads created"
              description="New leads by month (live)"
              contentClassName="h-[280px] p-0"
            >
              <EvilLineChart
                data={analytics.pipelinePerfData}
                config={analytics.pipelinePerfConfig}
                className="h-full w-full p-4"
                xDataKey="month"
              >
                <XAxis dataKey="month" />
                <Legend isClickable />
                <Tooltip />
                <Line dataKey="value" strokeVariant="solid" isClickable />
              </EvilLineChart>
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Lead source breakdown"
              description="Leads by acquisition channel (live)"
              contentClassName="h-[280px] p-0"
            >
              {analytics.leadSourceData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No source data</div>
              ) : (
                <EvilPieChart
                  className="h-full w-full p-4"
                  data={analytics.leadSourceData}
                  dataKey="count"
                  nameKey="source"
                  config={analytics.leadSourceConfig}
                >
                  <PieLegend isClickable />
                  <PieTooltip />
                  <Pie isClickable />
                </EvilPieChart>
              )}
            </AnalyticsChartCard>
          </DashboardSection>

          <DashboardSection gridClassName="lg:grid-cols-2">
            <AnalyticsChartCard
              title="Won vs Lost"
              description="Monthly conversion outcomes (live)"
              contentClassName="h-[280px] p-0"
            >
              <EvilBarChart
                data={analytics.wonLostData}
                config={analytics.wonLostConfig}
                className="h-full w-full p-4"
                xDataKey="month"
              >
                <Grid />
                <BarXAxis dataKey="month" />
                <BarLegend isClickable />
                <BarTooltip />
                <Bar dataKey="won" isClickable />
                <Bar dataKey="lost" isClickable />
              </EvilBarChart>
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Project type distribution"
              description="Leads by project category (live)"
              contentClassName="h-[280px] p-0"
            >
              {analytics.projectTypeData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No type data</div>
              ) : (
                <EvilPieChart
                  className="h-full w-full p-4"
                  data={analytics.projectTypeData}
                  dataKey="count"
                  nameKey="type"
                  config={analytics.projectTypeConfig}
                >
                  <PieLegend isClickable />
                  <PieTooltip />
                  <Pie isClickable />
                </EvilPieChart>
              )}
            </AnalyticsChartCard>
          </DashboardSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Conversion forecast</CardTitle>
                <Badge variant="outline" className="text-xs">Next 3 months</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Month</TableHead>
                      <TableHead>Expected wins</TableHead>
                      <TableHead>Committed</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.forecastRows.map((r) => (
                      <TableRow key={r.month}>
                        <TableCell className="pl-6 font-semibold">{r.month}</TableCell>
                        <TableCell className="font-medium">{r.forecast}</TableCell>
                        <TableCell>{r.committed ? r.committed : "—"}</TableCell>
                        <TableCell className="pr-6">
                          <Badge variant={STATUS_VARIANT[r.status] || "secondary"} className="capitalize text-[10px]">
                            {r.status.replace("-", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="px-6 py-3 text-xs text-muted-foreground">
                  Forecast from recent lead intake × current win rate. Not a revenue projection (leads have no deal value).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rep leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned reps with leads yet.</p>
                ) : (
                  analytics.leaderboard.map((rep, i) => {
                    const initials = rep.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div key={`${rep.name}-${i}`} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                        <span className="w-5 text-sm font-bold text-muted-foreground">#{i + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                            {initials || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{rep.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {rep.deals} won · {rep.open} open
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{rep.rate} win</Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageShell>
  );
}
