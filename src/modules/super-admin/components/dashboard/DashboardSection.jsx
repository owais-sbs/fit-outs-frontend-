import { cn } from "@/lib/utils";

export default function DashboardSection({
  title,
  description,
  children,
  className,
  gridClassName,
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className={cn("grid items-stretch gap-4 lg:gap-6", gridClassName)}>{children}</div>
    </section>
  );
}
