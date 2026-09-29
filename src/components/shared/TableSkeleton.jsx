/**
 * Usage: <TableSkeleton rows={5} cols={4} /> — loading placeholder for tabular layouts.
 */
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function TableSkeleton({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("w-full space-y-2", className)} role="status" aria-label="Loading table">
      <div className="flex gap-3 pb-1">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export { TableSkeleton }
export default TableSkeleton
