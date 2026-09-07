import { PageShell, SearchInput } from "@/components/layout/PageShell";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";

/** Shared page chrome for Design QAS routes. */
export function DesignQasPageShell({ title, description, actions, stats, search, onSearchChange, searchPlaceholder, resultCount, children }) {
  return (
    <PageShell className="space-y-5">
      <PageHeader title={title} description={description} actions={actions} />

      {stats ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats}</div> : null}

      <div className="flex flex-col gap-2 rounded-lg sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        {typeof resultCount === "number" && (
          <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
            {resultCount} {resultCount === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {children}
    </PageShell>
  );
}

export function DesignQasStat({ label, value, tone = "default" }) {
  const toneClass = {
    default: "text-foreground",
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
  }[tone];

  return (
    <div className="rounded-xl border border-border/50 bg-card px-4 py-3.5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
