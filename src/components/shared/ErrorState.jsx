/**
 * Usage: <ErrorState message="Failed to load" onRetry={refetch} />
 * Inline page error with optional retry button.
 */
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/80 bg-muted/40 px-4 py-10 text-center",
        className
      )}
      role="alert"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <AlertCircle className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {message ? (
          <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export { ErrorState }
export default ErrorState
