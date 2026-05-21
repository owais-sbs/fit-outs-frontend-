import { useState } from "react";
import { BarChart3, DollarSign, Target, Users } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import AnalyticsToolbar from "@/modules/shared/components/AnalyticsToolbar";
import KpiGrid from "@/modules/shared/components/KpiGrid";
import AnalyticsChartCard from "@/modules/super-admin/components/dashboard/AnalyticsChartCard";
import DashboardSection from "@/modules/super-admin/components/dashboard/DashboardSection";
import {
  EvilLineChart,
  Line,
  XAxis,
  Legend,
  Tooltip,
} from "@/components/evilcharts/charts/line-chart";
import { EvilPieChart, Pie } from "@/components/evilcharts/charts/pie-chart";
import { EvilBarChart, Bar, Grid, Legend as BarLegend, Tooltip as BarTooltip } from "@/components/evilcharts/charts/bar-chart";
import {
  CRM_REPORT_KPIS,
  PIPELINE_PERF_DATA,
  PIPELINE_PERF_CONFIG,
  LEAD_SOURCE_DATA,
  LEAD_SOURCE_CONFIG,
  TEAM_PERF_DATA,
  TEAM_PERF_CONFIG,
} from "../data/crm-reports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ICONS = {
  pipeline: BarChart3,
  won: DollarSign,
  conversion: Target,
  cycle: Users,
};

const FORECAST_ROWS = [
  { month: "Jun", forecast: 520, committed: 428 },
  { month: "Jul", forecast: 580, committed: 0 },
  { month: "Aug", forecast: 610, committed: 0 },
];

export default function CrmReportsPage() {
  const [period, setPeriod] = useState("30d");
  const [assignee, setAssignee] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-05-21");

  return (
    <div className="space-y-8">
      <PageHeader title="CRM reports" description="Pipeline, conversion, team performance, and revenue forecast." />

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
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              <SelectItem value="james">James Wu</SelectItem>
              <SelectItem value="emma">Emma Walsh</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <KpiGrid kpis={CRM_REPORT_KPIS} icons={ICONS} />

      <DashboardSection gridClassName="lg:grid-cols-2">
        <AnalyticsChartCard title="Pipeline performance" description="Open pipeline value ($k)" contentClassName="h-[280px] p-0">
          <EvilLineChart data={PIPELINE_PERF_DATA} config={PIPELINE_PERF_CONFIG} className="h-full w-full p-4" xDataKey="month">
            <XAxis dataKey="month" /><Legend isClickable /><Tooltip />
            <Line dataKey="value" strokeVariant="solid" isClickable />
          </EvilLineChart>
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Lead source breakdown" contentClassName="h-[280px] p-0">
          <EvilPieChart className="h-full w-full p-4" data={LEAD_SOURCE_DATA} dataKey="count" nameKey="source" config={LEAD_SOURCE_CONFIG}>
            <Legend isClickable /><Tooltip /><Pie isClickable />
          </EvilPieChart>
        </AnalyticsChartCard>
        <AnalyticsChartCard title="Team performance" contentClassName="h-[280px] p-0">
          <EvilBarChart data={TEAM_PERF_DATA} config={TEAM_PERF_CONFIG} className="h-full w-full p-4" xDataKey="rep">
            <Grid /><XAxis dataKey="rep" /><BarLegend isClickable /><BarTooltip />
            <Bar dataKey="deals" isClickable /><Bar dataKey="revenue" isClickable />
          </EvilBarChart>
        </AnalyticsChartCard>
      </DashboardSection>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Revenue forecast ($k)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Month</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead className="pr-6">Committed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FORECAST_ROWS.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="pl-6 font-medium">{r.month}</TableCell>
                  <TableCell>${r.forecast}k</TableCell>
                  <TableCell className="pr-6">{r.committed ? `$${r.committed}k` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
