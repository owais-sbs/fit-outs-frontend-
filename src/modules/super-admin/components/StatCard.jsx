import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatTile } from "@/components/layout/PageShell";

export default function StatCard({ title, value, icon: Icon, growth, growthLabel }) {
  const isPositive = growth >= 0;

  return (
    <StatTile
      label={title}
      value={value}
      icon={Icon}
      hint={
        <span className="inline-flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span
            className={cn(
              "font-semibold",
              isPositive ? "text-emerald-600" : "text-destructive"
            )}
          >
            {isPositive ? "+" : ""}
            {growth}%
          </span>
          <span>{growthLabel}</span>
        </span>
      }
    />
  );
}
