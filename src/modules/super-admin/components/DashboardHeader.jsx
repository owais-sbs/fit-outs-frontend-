import { TenantQuickActions } from "./tenant-management";

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export default function DashboardHeader() {
  const currentDate = formatCurrentDate();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{currentDate}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Super Admin
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Platform overview - monitor tenants, subscriptions, and revenue at a glance.
        </p>
      </div>
      <TenantQuickActions />
    </div>
  );
}
