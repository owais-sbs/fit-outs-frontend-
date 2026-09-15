import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/layout/PageShell";

export default function StatCard({ title, value, icon: Icon, growth, growthLabel, valueColor }) {
  const showGrowth = typeof growth === "number" && !Number.isNaN(growth);
  const isPositive = showGrowth && growth >= 0;

  return (
    <StatTile
      label={title}
      value={<span className={cn(valueColor)}>{value}</span>}
      icon={Icon}
      hint={
        showGrowth ? (
          <span className="inline-flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={cn(
                "font-semibold",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {isPositive ? "+" : ""}
              {growth}%
            </span>
            {growthLabel ? <span className="text-muted-foreground">{growthLabel}</span> : null}
          </span>
        ) : null
      }
    />
  );
}
