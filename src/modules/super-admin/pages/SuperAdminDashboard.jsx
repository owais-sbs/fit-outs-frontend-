import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import StatCardSkeleton from "../components/StatCardSkeleton";
import FiltersBar from "../components/FiltersBar";
import TenantTable from "../components/TenantTable";
import TenantTableSkeleton from "../components/TenantTableSkeleton";
import DashboardAnalytics from "../components/dashboard/DashboardAnalytics";
import DashboardAnalyticsSkeleton from "../components/dashboard/DashboardAnalyticsSkeleton";
import { ANALYTICS_STATS } from "../data/analytics-dashboard";
import { MOCK_TENANTS } from "../data/mock-dashboard";

const STAT_ICONS = {
  "total-tenants": Building2,
  "active-subscriptions": CreditCard,
  "monthly-revenue": CircleDollarSign,
  "trial-conversions": TrendingUp,
};

function filterTenants(tenants, searchQuery, planFilter, statusFilter) {
  const query = searchQuery.trim().toLowerCase();

  return tenants.filter((tenant) => {
    const matchesSearch =
      !query ||
      tenant.name.toLowerCase().includes(query) ||
      tenant.plan.toLowerCase().includes(query);

    const matchesPlan =
      planFilter === "all" ||
      tenant.plan.toLowerCase() === planFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });
}

export default function SuperAdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredTenants = useMemo(
    () => filterTenants(MOCK_TENANTS, searchQuery, planFilter, statusFilter),
    [searchQuery, planFilter, statusFilter]
  );

  return (
    <div className="space-y-10">
      <DashboardHeader />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : ANALYTICS_STATS.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={STAT_ICONS[stat.id]}
                growth={stat.growth}
                growthLabel={stat.growthLabel}
              />
            ))}
      </section>

      {isLoading ? <DashboardAnalyticsSkeleton /> : <DashboardAnalytics />}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tenant overview</h2>
          <p className="text-sm text-muted-foreground">
            Search and filter tenants across the platform
          </p>
        </div>
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          planFilter={planFilter}
          onPlanChange={setPlanFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        {isLoading ? (
          <TenantTableSkeleton />
        ) : (
          <TenantTable tenants={filteredTenants} />
        )}
      </section>
    </div>
  );
}
