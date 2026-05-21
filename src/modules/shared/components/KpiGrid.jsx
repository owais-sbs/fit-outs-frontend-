import StatCard from "@/modules/super-admin/components/StatCard";
import StatCardSkeleton from "@/modules/super-admin/components/StatCardSkeleton";

export default function KpiGrid({ kpis, icons = {}, loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.id}
          title={kpi.title}
          value={kpi.value}
          icon={icons[kpi.id]}
          growth={kpi.growth}
          growthLabel={kpi.growthLabel}
        />
      ))}
    </div>
  );
}
