import { EvilRadialChart, RadialBar, Tooltip, Legend } from "@/components/evilcharts/charts/radial-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  SYSTEM_HEALTH_DATA,
  SYSTEM_HEALTH_CONFIG,
} from "../../data/analytics-dashboard";

export default function SystemHealthRadialChart() {
  return (
    <AnalyticsChartCard
      title="System health"
      description="Platform utilization - API, storage, active users, and job queue"
      compact
      contentClassName="h-[240px] min-h-[220px] p-0">
      <EvilRadialChart
        className="h-full w-full p-4"
        data={SYSTEM_HEALTH_DATA}
        nameKey="metric"
        config={SYSTEM_HEALTH_CONFIG}
        variant="full">
        <Legend isClickable />
        <Tooltip />
        <RadialBar dataKey="utilization" isClickable />
      </EvilRadialChart>
    </AnalyticsChartCard>
  );
}
