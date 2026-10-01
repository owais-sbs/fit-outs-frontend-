/**
 * Loading placeholder for Planning Hub tab content (and standalone plan pages).
 */
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PlanningHubSkeleton({ className, variant = "hub" }) {
  if (variant === "table") {
    return (
      <div
        className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}
        role="status"
        aria-label="Loading planning data"
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} role="status" aria-label="Loading planning data">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="ml-auto h-9 w-32" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}
