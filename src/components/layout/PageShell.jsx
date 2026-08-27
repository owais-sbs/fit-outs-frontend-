import { cn } from "@/lib/utils";

/** Soft page wrapper with enter motion. */
export function PageShell({ className, children, ...props }) {
  return (
    <div className={cn("page-enter space-y-6", className)} {...props}>
      {children}
    </div>
  );
}

/** Open metric tile — no bordered card chrome. */
export function StatTile({ label, value, icon: Icon, hint, className }) {
  return (
    <div className={cn("stat-tile flex items-start gap-3", className)}>
      {Icon ? (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/80 text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </div>
  );
}

/** Soft surface panel (borderless elevated). */
export function Surface({ className, children, ...props }) {
  return (
    <div className={cn("surface-panel", className)} {...props}>
      {children}
    </div>
  );
}

/** Page title block using display serif for H1 only. */
export function PageTitle({ title, subtitle, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
