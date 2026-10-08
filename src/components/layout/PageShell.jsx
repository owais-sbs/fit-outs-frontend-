import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Soft page wrapper with enter motion. */
export function PageShell({ className, children, ...props }) {
  return (
    <div className={cn("page-enter relative space-y-6", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Clean back control — sits above the page title (or icon-only beside breadcrumbs).
 */
export function PageBackLink({ to, state, onClick, title = "Back", iconOnly = false, className }) {
  const classes = cn(
    "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border/70 bg-card",
    iconOnly ? "w-8 px-0" : "w-fit px-2.5",
    "text-muted-foreground transition-colors cursor-pointer",
    "hover:bg-accent hover:text-accent-foreground hover:border-border",
    className
  );

  const content = (
    <>
      <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {!iconOnly && <span className="text-sm font-medium">{title}</span>}
    </>
  );

  if (typeof onClick === "function" && to == null) {
    return (
      <button type="button" className={classes} title={title} aria-label={title} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} state={state} className={classes} title={title} aria-label={title}>
      {content}
    </Link>
  );
}

/**
 * Page title with optional back control stacked cleanly above.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  backTo,
  backState,
  backOnClick,
  backTitle = "Back",
  backClassName,
}) {
  const hasBack = backTo != null || typeof backOnClick === "function";
  return (
    <div className={cn("space-y-3", className)}>
      {hasBack ? (
        <PageBackLink
          to={backTo}
          state={backState}
          onClick={backOnClick}
          title={backTitle}
          className={backClassName}
        />
      ) : null}
      <PageTitle
        className="min-w-0"
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
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

/** Compact page filter row — no padded card chrome. */
export function FilterToolbar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Page search field sized to the query, not the full layout width. */
export function SearchInput({ className, containerClassName, ...props }) {
  return (
    <div className={cn("relative w-full max-w-sm sm:w-80 sm:shrink-0", containerClassName)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={cn(
          "h-8 rounded-sm border-border bg-card pl-8 shadow-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}

/** Page title block using display serif for H1 only. */
export function PageTitle({ title, subtitle, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
