/**
 * Usage: <PageSkeleton /> — full-page loading placeholder (title + content blocks).
 */
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/shared/TableSkeleton"
import { cn } from "@/lib/utils"

function PageSkeleton({ className }) {
  return (
    <div className={cn("page-enter space-y-6", className)} role="status" aria-label="Loading page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 md:w-64" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="surface-panel p-5 md:p-6">
        <TableSkeleton rows={6} cols={4} />
      </div>
    </div>
  )
}

export { PageSkeleton }
export default PageSkeleton
