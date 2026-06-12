import {
  Building2,
  CircleDollarSign,
  Target,
  Users,
} from "lucide-react";
import {
  EvilLineChart,
  Line,
  XAxis,
  Legend,
  Tooltip,
  Dot,
  ActiveDot,
} from "@/components/evilcharts/charts/line-chart";
import {
  EvilAreaChart,
  Area,
  XAxis as AreaXAxis,
  Grid as AreaGrid,
  Legend as AreaLegend,
  Tooltip as AreaTooltip,
} from "@/components/evilcharts/charts/area-chart";
import {
  EvilBarChart,
  Bar,
  XAxis as BarXAxis,
  Grid as BarGrid,
  Legend as BarLegend,
  Tooltip as BarTooltip,
} from "@/components/evilcharts/charts/bar-chart";
import { EvilPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip } from "@/components/evilcharts/charts/pie-chart";
import AnalyticsChartCard from "../dashboard/AnalyticsChartCard";
import {
  REVENUE_ANALYTICS_DATA,
  REVENUE_CHART_CONFIG,
} from "../../data/analytics-dashboard";
import {
  TENANT_GROWTH_DATA,
  TENANT_GROWTH_CONFIG,
  CRM_PERFORMANCE_DATA,
  CRM_PERFORMANCE_CONFIG,
  LEAD_CONVERSION_DATA,
  LEAD_CONVERSION_CONFIG,
  SITE_VISIT_ANALYTICS_DATA,
  SITE_VISIT_CONFIG,
  SUBSCRIPTION_REVENUE_DATA,
  SUBSCRIPTION_REVENUE_CONFIG,
  MONTHLY_TRENDS_DATA,
  MONTHLY_TRENDS_CONFIG,
} from "../../data/reports-analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const KPI_ICONS = {
  mrr: CircleDollarSign,
  tenants: Building2,
  crm: Target,
  conversion: Users,
};

export { KPI_ICONS };

export function RevenueAnalyticsSection() {
  return (
    <AnalyticsChartCard
      title="Revenue analytics"
      description="MRR and CRM pipeline value (AED thousands)"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilLineChart
        data={REVENUE_ANALYTICS_DATA}
        config={REVENUE_CHART_CONFIG}
        className="h-full w-full p-4"
        xDataKey="month">
        <XAxis dataKey="month" />
        <Legend isClickable />
        <Tooltip />
        <Line dataKey="mrr" strokeVariant="solid" isClickable>
          <Dot variant="border" />
          <ActiveDot variant="colored-border" />
        </Line>
        <Line dataKey="crmPipeline" strokeVariant="solid" isClickable>
          <Dot variant="border" />
          <ActiveDot variant="colored-border" />
        </Line>
      </EvilLineChart>
    </AnalyticsChartCard>
  );
}

export function TenantGrowthSection() {
  return (
    <AnalyticsChartCard
      title="Tenant growth"
      description="New tenants vs churn across the platform"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilAreaChart
        data={TENANT_GROWTH_DATA}
        config={TENANT_GROWTH_CONFIG}
        className="h-full w-full p-4"
        xDataKey="month">
        <AreaGrid />
        <AreaXAxis dataKey="month" />
        <AreaLegend isClickable />
        <AreaTooltip />
        <Area dataKey="newTenants" variant="gradient" isClickable />
        <Area dataKey="churned" variant="gradient" isClickable />
      </EvilAreaChart>
    </AnalyticsChartCard>
  );
}

export function CrmPerformanceSection() {
  return (
    <AnalyticsChartCard
      title="CRM performance"
      description="Lead funnel volume by month"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilBarChart
        data={CRM_PERFORMANCE_DATA}
        config={CRM_PERFORMANCE_CONFIG}
        className="h-full w-full p-4"
        xDataKey="month">
        <BarGrid />
        <BarXAxis dataKey="month" />
        <BarLegend isClickable />
        <BarTooltip />
        <Bar dataKey="leads" isClickable />
        <Bar dataKey="qualified" isClickable />
        <Bar dataKey="won" isClickable />
      </EvilBarChart>
    </AnalyticsChartCard>
  );
}

export function LeadConversionSection() {
  const pieData = LEAD_CONVERSION_DATA.map((d) => ({
    stage: d.stage,
    value: d.rate,
  }));
  return (
    <AnalyticsChartCard
      title="Lead conversion rates"
      description="Stage-to-stage conversion across fit-out sales pipeline"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilPieChart
        className="h-full w-full p-4"
        data={pieData}
        dataKey="value"
        nameKey="stage"
        config={LEAD_CONVERSION_CONFIG}>
        <PieLegend isClickable />
        <PieTooltip />
        <Pie isClickable />
      </EvilPieChart>
    </AnalyticsChartCard>
  );
}

export function SiteVisitAnalyticsSection() {
  return (
    <AnalyticsChartCard
      title="Site visit analytics"
      description="Scheduled vs completed inspections"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilAreaChart
        data={SITE_VISIT_ANALYTICS_DATA}
        config={SITE_VISIT_CONFIG}
        className="h-full w-full p-4"
        stackType="stacked"
        xDataKey="month">
        <AreaGrid />
        <AreaXAxis dataKey="month" />
        <AreaLegend isClickable />
        <AreaTooltip />
        <Area dataKey="scheduled" variant="gradient" isClickable />
        <Area dataKey="completed" variant="gradient" isClickable />
      </EvilAreaChart>
    </AnalyticsChartCard>
  );
}

export function SubscriptionRevenueSection() {
  return (
    <AnalyticsChartCard
      title="Subscription revenue"
      description="MRR by plan tier"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilPieChart
        className="h-full w-full p-4"
        data={SUBSCRIPTION_REVENUE_DATA}
        dataKey="revenue"
        nameKey="plan"
        config={SUBSCRIPTION_REVENUE_CONFIG}>
        <PieLegend isClickable />
        <PieTooltip />
        <Pie isClickable />
      </EvilPieChart>
    </AnalyticsChartCard>
  );
}

export function MonthlyTrendsSection() {
  return (
    <AnalyticsChartCard
      title="Monthly trends"
      description="MRR, site visits, and lead volume combined"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilLineChart
        data={MONTHLY_TRENDS_DATA}
        config={MONTHLY_TRENDS_CONFIG}
        className="h-full w-full p-4"
        xDataKey="month">
        <XAxis dataKey="month" />
        <Legend isClickable />
        <Tooltip />
        <Line dataKey="mrr" strokeVariant="solid" isClickable />
        <Line dataKey="visits" strokeVariant="solid" isClickable />
        <Line dataKey="leads" strokeVariant="solid" isClickable />
      </EvilLineChart>
    </AnalyticsChartCard>
  );
}

export function ReportsMetricsTable({ rows }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Key metrics summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Metric</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="pr-6">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.metric}>
                <TableCell className="pl-6 font-medium">{row.metric}</TableCell>
                <TableCell>{row.value}</TableCell>
                <TableCell className="pr-6 text-primary">{row.change}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
