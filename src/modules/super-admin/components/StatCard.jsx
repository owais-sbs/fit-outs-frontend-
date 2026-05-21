import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, growth, growthLabel }) {
  const isPositive = growth >= 0;

  return (
    <Card className="border-border/60 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
            <div className="flex items-center gap-1.5 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              <span
                className={cn(
                  "font-semibold",
                  isPositive ? "text-emerald-600" : "text-destructive"
                )}>
                {isPositive ? "+" : ""}
                {growth}%
              </span>
              <span className="text-muted-foreground">{growthLabel}</span>
            </div>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
