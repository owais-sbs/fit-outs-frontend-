import { Skeleton } from "@/components/ui/skeleton";

export default function StatCardSkeleton() {
  return (
    <div className="stat-tile flex items-start gap-3">
      <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
