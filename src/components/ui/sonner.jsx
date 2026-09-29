/**
 * Usage: mount <Toaster /> once inside ThemeProvider (see src/index.js).
 * Prefer notify.* from @/lib/notify; plain toast() from "sonner" still works.
 */
import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from "lucide-react"
import { useTheme } from "@/shared/theme/ThemeProvider"

function Toaster({ ...props }) {
  const { theme } = useTheme()
  const [position, setPosition] = useState("top-right")

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const sync = () => setPosition(mq.matches ? "top-center" : "top-right")
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return (
    <Sonner
      theme={theme}
      position={position}
      closeButton
      duration={4000}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />,
        error: <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />,
        warning: <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />,
        info: <Info className="h-4 w-4 shrink-0" aria-hidden />,
        loading: <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-[var(--radius)] border-0 shadow-[var(--shadow-md)] " +
            "group-[.toaster]:bg-card group-[.toaster]:text-card-foreground",
          title: "font-semibold",
          description: "opacity-90",
          closeButton:
            "border-0 bg-black/10 text-inherit hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20",
          actionButton:
            "bg-white/20 text-inherit hover:bg-white/30",
          cancelButton:
            "bg-black/10 text-inherit hover:bg-black/20",
          success:
            "!bg-[oklch(var(--toast-success))] !text-[oklch(var(--toast-success-foreground))] " +
            "[&_[data-description]]:!text-[oklch(var(--toast-success-foreground)/0.9)]",
          error:
            "!bg-[oklch(var(--toast-error))] !text-[oklch(var(--toast-error-foreground))] " +
            "[&_[data-description]]:!text-[oklch(var(--toast-error-foreground)/0.9)]",
          warning:
            "!bg-[oklch(var(--toast-warning))] !text-[oklch(var(--toast-warning-foreground))] " +
            "[&_[data-description]]:!text-[oklch(var(--toast-warning-foreground)/0.9)]",
          info:
            "!bg-[oklch(var(--toast-info))] !text-[oklch(var(--toast-info-foreground))] " +
            "[&_[data-description]]:!text-[oklch(var(--toast-info-foreground)/0.9)]",
          loading:
            "!bg-card !text-card-foreground border border-border " +
            "[&_[data-description]]:!text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
