import {
  EvilAreaChart,
  Area,
  XAxis,
  Grid,
  Tooltip,
  Legend,
  Dot,
  ActiveDot,
} from "@/components/evilcharts/charts/area-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  SUBSCRIPTION_GROWTH_DATA,
  SUBSCRIPTION_GROWTH_CONFIG,
} from "../../data/analytics-dashboard";

export default function SubscriptionGrowthChart() {
  return (
    <AnalyticsChartCard
      title="Subscription growth"
      description="New subscriptions vs renewals - tenant acquisition and retention"
      contentClassName="h-[300px] min-h-[260px] p-0">
      <EvilAreaChart
        data={SUBSCRIPTION_GROWTH_DATA}
        config={SUBSCRIPTION_GROWTH_CONFIG}
        className="h-full w-full p-4"
        stackType="stacked"
        showBrush
        xDataKey="month"
        brushFormatLabel={(value) => String(value)}>
        <Grid />
        <XAxis dataKey="month" />
        <Legend isClickable />
        <Tooltip />
        <Area dataKey="newSubscriptions" variant="gradient" isClickable>
          <Dot variant="border" />
          <ActiveDot variant="colored-border" />
        </Area>
        <Area dataKey="renewals" variant="gradient" isClickable>
          <Dot variant="border" />
          <ActiveDot variant="colored-border" />
        </Area>
      </EvilAreaChart>
    </AnalyticsChartCard>
  );
}
