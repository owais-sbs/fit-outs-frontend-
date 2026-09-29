/**
 * Usage: <Breadcrumbs items={[{ label: "Projects", to: "/projects" }, { label: "Detail" }]} />
 * Presentational only — not wired into layouts yet. Last item is the current page (no link).
 */
import { Fragment } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function Breadcrumbs({ items = [], className }) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? (
                <li aria-hidden className="flex items-center text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </li>
              ) : null}
              <li className="flex items-center">
                {isLast || !item.to ? (
                  <span
                    className={cn(
                      "font-medium text-foreground",
                      !isLast && "text-muted-foreground"
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumbs }
export default Breadcrumbs
