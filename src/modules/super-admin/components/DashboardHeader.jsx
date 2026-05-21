import { Building2, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          Platform overview — monitor tenants, subscriptions, and revenue at a glance.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add tenant
        </Button>
        <Button variant="secondary" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          View all tenants
        </Button>
      </div>
    </div>
  );
}
