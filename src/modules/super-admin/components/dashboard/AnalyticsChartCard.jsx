import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsChartCard({
  title,
  description,
  children,
  className,
  contentClassName,
  compact = false,
}) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden border-border/60 bg-card/80 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md",
        className
      )}>
      <CardHeader
        className={cn(
          "border-b border-border/60 pb-4",
          compact ? "px-4 pt-4 pb-3" : "px-5 pt-5 pb-4"
        )}>
        <CardTitle className={cn("text-base font-semibold tracking-tight", compact && "text-sm")}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs leading-relaxed">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          "flex-1",
          compact ? "px-4 pb-4 pt-3" : "px-5 pb-5 pt-4",
          contentClassName
        )}>
        {children}
      </CardContent>
    </Card>
  );
}
