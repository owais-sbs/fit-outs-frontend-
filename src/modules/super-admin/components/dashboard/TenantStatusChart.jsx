import { EvilBarChart, Bar, XAxis, Grid, Tooltip, Legend } from "@/components/evilcharts/charts/bar-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  TENANT_STATUS_DATA,
  TENANT_STATUS_CONFIG,
} from "../../data/analytics-dashboard";

export default function TenantStatusChart() {
  return (
    <AnalyticsChartCard
      title="Active vs suspended tenants"
      description="Tenant account status across the platform"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilBarChart
        data={TENANT_STATUS_DATA}
        config={TENANT_STATUS_CONFIG}
        className="h-full w-full p-4"
        xDataKey="month"
        showBrush
        brushFormatLabel={(value) => String(value)}>
        <Grid />
        <XAxis dataKey="month" />
        <Legend isClickable />
        <Tooltip />
        <Bar dataKey="active" variant="default" isClickable />
        <Bar dataKey="suspended" variant="default" isClickable />
      </EvilBarChart>
    </AnalyticsChartCard>
  );
}
