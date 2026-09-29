/**
 * Usage:
 *   <LoadingPanel messages={loadingMessages.leads} size="page" />
 *   <LoadingPanel size="section" title="Loading clients" />
 *   <LoadingPanel size="inline" />
 *
 * Visual-only: 200ms show-delay (no fetch delay). Indeterminate bar, rotating messages.
 */
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { loadingMessages } from "@/components/shared/loadingMessages"

const ROTATE_MS = 1800
const SHOW_DELAY_MS = 200

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [])

  return reduced
}

function LoadingPanel({
  messages,
  title,
  size = "section",
  className,
}) {
  const lines = messages?.length ? messages : loadingMessages.generic
  const reducedMotion = usePrefersReducedMotion()
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!visible || reducedMotion || lines.length <= 1) return undefined
    const id = window.setInterval(() => {
      setFadeIn(false)
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length)
        setFadeIn(true)
      }, 160)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [visible, reducedMotion, lines])

  if (!visible) return null

  const message = lines[Math.min(index, lines.length - 1)]
  const label = title || message

  const isPage = size === "page"
  const isInline = size === "inline"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex text-muted-foreground",
        isPage && "flex-col items-center justify-center gap-4 py-16 md:py-24",
        size === "section" && "flex-col items-center justify-center gap-3 px-6 py-10",
        isInline && "flex-row items-center gap-3 py-2",
        className
      )}
    >
      {!isInline && (
        <Loader2
          className={cn(
            "h-5 w-5 text-primary",
            !reducedMotion && "animate-pulse"
          )}
          aria-hidden
        />
      )}

      {title && !isInline && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}

      <div
        className={cn(
          "overflow-hidden text-center",
          isInline ? "min-w-0 flex-1 text-left" : "h-5 w-full max-w-sm"
        )}
      >
        <p
          className={cn(
            "text-sm transition-all duration-200 ease-out",
            fadeIn && !reducedMotion
              ? "translate-y-0 opacity-100"
              : reducedMotion
                ? "opacity-100"
                : "translate-y-1 opacity-0"
          )}
        >
          {message}
        </p>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-muted",
          isInline ? "h-1.5 w-24 shrink-0" : "h-1.5 w-full max-w-xs"
        )}
        role="progressbar"
        aria-label={label}
        aria-valuetext={message}
      >
        <div
          className={cn(
            "loading-bar-indeterminate absolute inset-y-0 rounded-full bg-primary",
            reducedMotion && "loading-bar-static"
          )}
        />
      </div>
    </div>
  )
}

export { LoadingPanel }
export default LoadingPanel
