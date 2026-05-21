import { EvilPieChart, Pie, Tooltip, Legend } from "@/components/evilcharts/charts/pie-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  TENANT_PLAN_DATA,
  TENANT_PLAN_CONFIG,
} from "../../data/analytics-dashboard";

export default function TenantDistributionChart() {
  return (
    <AnalyticsChartCard
      title="Tenant plan distribution"
      description="Active tenants by subscription tier on the OnePath Fitouts platform"
      contentClassName="h-[320px] min-h-[280px] p-0">
      <EvilPieChart
        className="h-full w-full p-4"
        data={TENANT_PLAN_DATA}
        dataKey="tenants"
        nameKey="plan"
        config={TENANT_PLAN_CONFIG}>
        <Legend isClickable />
        <Tooltip />
        <Pie isClickable />
      </EvilPieChart>
    </AnalyticsChartCard>
  );
}
