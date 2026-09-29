import {
  Building2,
  CircleDollarSign,
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
import { EvilPieChart, Pie, Legend as PieLegend, Tooltip as PieTooltip } from "@/components/evilcharts/charts/pie-chart";
import AnalyticsChartCard from "../dashboard/AnalyticsChartCard";
import {
  REVENUE_ANALYTICS_DATA,
  REVENUE_CHART_CONFIG,
} from "../../data/analytics-dashboard";
import {
  TENANT_GROWTH_DATA,
  TENANT_GROWTH_CONFIG,
  SITE_VISIT_ANALYTICS_DATA,
  SITE_VISIT_CONFIG,
  SUBSCRIPTION_REVENUE_DATA,
  SUBSCRIPTION_REVENUE_CONFIG,
  MONTHLY_TRENDS_DATA,
  MONTHLY_TRENDS_CONFIG,
} from "../../data/reports-analytics";
const KPI_ICONS = {
  mrr: CircleDollarSign,
  tenants: Building2,
};

export { KPI_ICONS };

export function RevenueAnalyticsSection() {
  return (
    <AnalyticsChartCard
      title="Revenue analytics"
      description="Platform MRR (AED thousands)"
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
      description="MRR and site visit volume combined"
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
      </EvilLineChart>
    </AnalyticsChartCard>
  );
}

