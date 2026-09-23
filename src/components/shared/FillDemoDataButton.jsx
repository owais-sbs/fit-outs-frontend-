import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Outline pill control matching the product "Fill Demo Data" pattern.
 * Use in form headers / drawers to prefill relevant demo values.
 */
export function FillDemoDataButton({ onClick, className, label = "Fill Demo Data", disabled = false }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 gap-1.5 rounded-full border-border/70 bg-background px-3 text-xs font-medium text-foreground shadow-none",
        className
      )}
    >
      <Wand2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
