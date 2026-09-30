/**
 * Catch-all 404 for unknown paths. Wired via App.js path="*".
 * Polished 404 page; token/dark-mode safe.
 */
import { Link } from "react-router-dom"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageShell } from "@/components/layout/PageShell"

export default function NotFoundPage() {
  return (
    <PageShell className="flex min-h-[60vh] flex-col items-center justify-center">
      <p className="font-display text-6xl font-semibold tracking-tight text-muted-foreground/40 md:text-7xl">
        404
      </p>
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist or may have been moved."
        action={
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        }
        className="py-6"
      />
    </PageShell>
  )
}
