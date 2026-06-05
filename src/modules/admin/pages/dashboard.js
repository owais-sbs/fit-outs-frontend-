import { useState } from "react";
import {
  BarChart3, DollarSign, Target, Trophy,
  TrendingUp, MapPin, Download,
} from "lucide-react";
import DashboardHeader from "../../super-admin/components/DashboardHeader";
import AnalyticsToolbar from "@/modules/shared/components/AnalyticsToolbar";
import AnalyticsChartCard from "@/modules/super-admin/components/dashboard/AnalyticsChartCard";
import DashboardSection from "@/modules/super-admin/components/dashboard/DashboardSection";
import {
  EvilLineChart, Line, XAxis, Legend, Tooltip,
} from "@/components/evilcharts/charts/line-chart";
import { 
  EvilPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip 
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

import {
  PIPELINE_PERF_DATA, PIPELINE_PERF_CONFIG,
  LEAD_SOURCE_DATA, LEAD_SOURCE_CONFIG,
} from "../data/crm-reports";

// ─── Extended KPIs (6 cards) ──────────────────────────────────────────────────
const EXTENDED_KPIS = [
  { id: "pipeline",   title: "Pipeline value",    value: "$2.4M",  growth: 11.2, growthLabel: "open deals" },
  { id: "won",        title: "Won this month",    value: "$428k",  growth: 18.4, growthLabel: "vs last month" },
  { id: "lost",       title: "Lost this month",   value: "$95k",   growth: -4.2, growthLabel: "vs last month" },
  { id: "conversion", title: "Win rate",          value: "24%",    growth: 2.1,  growthLabel: "qualified → won" },
  { id: "revenue",    title: "Monthly revenue",   value: "$142k",  growth: 9.8,  growthLabel: "vs target" },
  { id: "visits",     title: "Site visits",       value: "12",     growth: 20.0, growthLabel: "this month" },
];

const EXTENDED_ICONS = {
  pipeline:   BarChart3,
  won:        Trophy,
  lost:       Target,
  conversion: TrendingUp,
  revenue:    DollarSign,
  visits:     MapPin,
};

// ─── Forecast table ──────────────────────────────────────────────────────────
const FORECAST_ROWS = [
  { month: "Jun", leads: 42, forecast: 520, committed: 428, status: "on-track" },
  { month: "Jul", leads: 38, forecast: 580, committed: 0,   status: "at-risk" },
  { month: "Aug", leads: 35, forecast: 610, committed: 0,   status: "pending" },
];

const STATUS_VARIANT = {
  "on-track": "success",
  "at-risk":  "warning",
  "pending":  "secondary",
};

// ─── Won vs Lost data ─────────────────────────────────────────────────────────
const WON_LOST_DATA = [
  { month: "Jan", won: 3, lost: 2 },
  { month: "Feb", won: 4, lost: 1 },
  { month: "Mar", won: 5, lost: 3 },
  { month: "Apr", won: 6, lost: 2 },
  { month: "May", won: 8, lost: 4 },
];
const WON_LOST_CONFIG = {
  won:  { label: "Won",  colors: { light: { from: "#10b981", to: "#059669" }, dark: { from: "#10b981", to: "#059669" } } },
  lost: { label: "Lost", colors: { light: { from: "#ef4444", to: "#dc2626" }, dark: { from: "#ef4444", to: "#dc2626" } } },
};

// ─── Project type distribution ────────────────────────────────────────────────
const PROJECT_TYPE_DATA = [
  { type: "commercial",  count: 38 },
  { type: "interior",    count: 28 },
  { type: "renovation",  count: 20 },
  { type: "residential", count: 16 },
  { type: "construction",count: 12 },
];
const PROJECT_TYPE_CONFIG = {
  commercial:   { label: "Commercial",   colors: { light: { from: "#f59e0b", to: "#d97706" }, dark: { from: "#f59e0b", to: "#d97706" } } },
  interior:     { label: "Interior",     colors: { light: { from: "#8b5cf6", to: "#7c3aed" }, dark: { from: "#8b5cf6", to: "#7c3aed" } } },
  renovation:   { label: "Renovation",   colors: { light: { from: "#06b6d4", to: "#0891b2" }, dark: { from: "#06b6d4", to: "#0891b2" } } },
  residential:  { label: "Residential",  colors: { light: { from: "#10b981", to: "#059669" }, dark: { from: "#10b981", to: "#059669" } } },
  construction: { label: "Construction", colors: { light: { from: "#f97316", to: "#ea580c" }, dark: { from: "#f97316", to: "#ea580c" } } },
};

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d");
  const [assignee, setAssignee] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-05-22");

  return (
    <div className="space-y-8">
      <DashboardHeader 
        title="Admin Dashboard"
        description="Monitor CRM analytics, lead pipeline, team performance, and system overview."
      >
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </DashboardHeader>

      <AnalyticsToolbar
        period={period}
        onPeriodChange={setPeriod}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onExport={() => {}}
        filterSlot={
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              <SelectItem value="james">James Wu</SelectItem>
              <SelectItem value="emma">Emma Walsh</SelectItem>
              <SelectItem value="tom">Tom Bradley</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* ── 6 KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXTENDED_KPIS.map((kpi) => {
          const Icon = EXTENDED_ICONS[kpi.id];
          const isPos = kpi.growth >= 0;
          return (
            <Card key={kpi.id} className="border-border/60 shadow-sm transition-all hover:border-primary/25 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={isPos ? "font-semibold text-emerald-600" : "font-semibold text-destructive"}>
                        {isPos ? "+" : ""}{kpi.growth}%
                      </span>
                      <span className="text-muted-foreground">{kpi.growthLabel}</span>
                    </div>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DashboardSection gridClassName="lg:grid-cols-2">
        <AnalyticsChartCard
          title="Pipeline performance"
          description="Open pipeline value ($k) over time"
          contentClassName="h-[280px] p-0"
        >
          <EvilLineChart data={PIPELINE_PERF_DATA} config={PIPELINE_PERF_CONFIG} className="h-full w-full p-4" xDataKey="month">
            <XAxis dataKey="month" />
            <Legend isClickable />
            <Tooltip />
            <Line dataKey="value" strokeVariant="solid" isClickable />
          </EvilLineChart>
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Lead source breakdown"
          description="Leads by acquisition channel"
          contentClassName="h-[280px] p-0"
        >
          <EvilPieChart className="h-full w-full p-4" data={LEAD_SOURCE_DATA} dataKey="count" nameKey="source" config={LEAD_SOURCE_CONFIG}>
            <PieLegend isClickable />
            <PieTooltip />
            <Pie isClickable />
          </EvilPieChart>
        </AnalyticsChartCard>
      </DashboardSection>

      <DashboardSection gridClassName="lg:grid-cols-2">
        <AnalyticsChartCard
          title="Won vs Lost"
          description="Monthly comparison"
          contentClassName="h-[280px] p-0"
        >
          <EvilBarChart data={WON_LOST_DATA} config={WON_LOST_CONFIG} className="h-full w-full p-4" xDataKey="month">
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
          description="Leads by project category"
          contentClassName="h-[280px] p-0"
        >
          <EvilPieChart className="h-full w-full p-4" data={PROJECT_TYPE_DATA} dataKey="count" nameKey="type" config={PROJECT_TYPE_CONFIG}>
            <PieLegend isClickable />
            <PieTooltip />
            <Pie isClickable />
          </EvilPieChart>
        </AnalyticsChartCard>
      </DashboardSection>



      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Revenue forecast ($k)</CardTitle>
            <Badge variant="outline" className="text-xs">Next 3 months</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Month</TableHead>
                  <TableHead>Forecast</TableHead>
                  <TableHead>Committed</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FORECAST_ROWS.map((r) => (
                  <TableRow key={r.month}>
                    <TableCell className="pl-6 font-semibold">{r.month}</TableCell>
                    <TableCell className="font-medium">${r.forecast}k</TableCell>
                    <TableCell>{r.committed ? `$${r.committed}k` : "—"}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={STATUS_VARIANT[r.status] || "secondary"} className="capitalize text-[10px]">
                        {r.status.replace("-", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Rep leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: "Tom Bradley",  deals: 7, revenue: 510, rate: "82%" },
              { name: "James Wu",     deals: 8, revenue: 420, rate: "76%" },
              { name: "Emma Walsh",   deals: 6, revenue: 380, rate: "71%" },
              { name: "Lisa Park",    deals: 4, revenue: 290, rate: "60%" },
            ].map((rep, i) => {
              const initials = rep.name.split(" ").map((n) => n[0]).join("");
              return (
                <div key={rep.name} className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                  <span className="w-5 text-sm font-bold text-muted-foreground">#{i + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rep.name}</p>
                    <p className="text-xs text-muted-foreground">{rep.deals} deals · ${rep.revenue}k</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{rep.rate} win</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
