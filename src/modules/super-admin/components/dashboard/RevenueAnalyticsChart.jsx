import {
  EvilLineChart,
  Line,
  XAxis,
  Legend,
  Tooltip,
  Dot,
  ActiveDot,
} from "@/components/evilcharts/charts/line-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import {
  REVENUE_ANALYTICS_DATA,
  REVENUE_CHART_CONFIG,
} from "../../data/analytics-dashboard";

export default function RevenueAnalyticsChart() {
  return (
    <AnalyticsChartCard
      title="Revenue analytics"
      description="MRR and CRM pipeline value across fit-out tenant accounts (AED thousands)"
      contentClassName="h-[320px] min-h-[280px] p-0">
      <EvilLineChart
        data={REVENUE_ANALYTICS_DATA}
        config={REVENUE_CHART_CONFIG}
        className="h-full w-full p-4"
        showBrush
        xDataKey="month"
        brushFormatLabel={(value) => String(value)}>
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
