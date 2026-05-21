import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsChartCard from "./AnalyticsChartCard";
import DashboardSection from "./DashboardSection";

function ChartSkeleton({ title }) {
  return (
    <AnalyticsChartCard title={title} contentClassName="h-[320px] p-4">
      <Skeleton className="h-full w-full rounded-lg" />
    </AnalyticsChartCard>
  );
}

export default function DashboardAnalyticsSkeleton() {
  return (
    <div className="space-y-10">
      <DashboardSection gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <ChartSkeleton title="Revenue analytics" />
        </div>
        <div className="xl:col-span-4">
          <ChartSkeleton title="Tenant plan distribution" />
        </div>
      </DashboardSection>
      <DashboardSection gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ChartSkeleton title="Subscription growth" />
        </div>
        <div className="xl:col-span-5">
          <ChartSkeleton title="Active vs suspended tenants" />
        </div>
      </DashboardSection>
      <DashboardSection gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-6 xl:col-start-4">
          <AnalyticsChartCard title="System health" compact contentClassName="h-[220px] p-4">
            <Skeleton className="mx-auto h-40 w-40 rounded-full" />
          </AnalyticsChartCard>
        </div>
      </DashboardSection>
    </div>
  );
}
