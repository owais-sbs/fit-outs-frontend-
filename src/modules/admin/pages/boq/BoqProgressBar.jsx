import { Check } from "lucide-react";
import { QAS_STEPS } from "./BoqEngine";
import { useBoq } from "./BoqEngine";
import { cn } from "@/lib/utils";

export default function BoqProgressBar() {
  const { currentStep, goToStep, session } = useBoq();

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm">
      <div className="px-6 py-3">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {QAS_STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            const isLocked = step.id > currentStep && !session;

            return (
              <div key={step.id} className="flex items-center shrink-0">
                {idx > 0 && (
                  <div
                    className={cn(
                      "h-px w-6 transition-colors duration-300",
                      isCompleted || isActive ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <button
                  onClick={() => !isLocked && goToStep(step.id)}
                  disabled={isLocked}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                      : isCompleted
                        ? "bg-primary/15 text-primary hover:bg-primary/25 cursor-pointer"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted cursor-pointer",
                    isLocked && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/25 text-primary-foreground"
                        : isCompleted
                          ? "bg-primary text-white"
                          : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-2.5 w-2.5" /> : step.id}
                  </span>
                  <span className="hidden sm:inline">{step.short}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
