import DashboardSection from "./DashboardSection";
import RevenueAnalyticsChart from "./RevenueAnalyticsChart";
import TenantDistributionChart from "./TenantDistributionChart";
import SubscriptionGrowthChart from "./SubscriptionGrowthChart";
import TenantStatusChart from "./TenantStatusChart";
import SystemHealthRadialChart from "./SystemHealthRadialChart";

export default function DashboardAnalytics() {
  return (
    <div className="space-y-10">
      <DashboardSection
        title="Platform analytics"
        description="Revenue, tenant mix, and subscription performance"
        gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RevenueAnalyticsChart />
        </div>
        <div className="xl:col-span-4">
          <TenantDistributionChart />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Growth analytics"
        description="Subscription velocity and tenant account health"
        gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SubscriptionGrowthChart />
        </div>
        <div className="xl:col-span-5">
          <TenantStatusChart />
        </div>
      </DashboardSection>

      <DashboardSection
        title="System health"
        description="Infrastructure utilization across core services"
        gridClassName="grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-6 xl:col-start-4">
          <SystemHealthRadialChart />
        </div>
      </DashboardSection>
    </div>
  );
}
