import { Check } from "lucide-react";
import { QAS_STEPS, QAS_STATUS } from "./BoqEngine";
import { useBoq } from "./BoqEngine";
import { cn } from "@/lib/utils";

export default function BoqProgressBar() {
  const { currentStep, goToStep, session } = useBoq();

  return (
    <div className="border-b border-border/60 bg-background">
      <div className="px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {QAS_STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            const qasComplete = session?.status === QAS_STATUS.COMPLETED;
            const isLocked =
              (step.id === 2 && !session) ||
              (step.id === 3 && !session) ||
              (step.id === 3 && currentStep < 3 && !qasComplete);

            return (
              <div key={step.id} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={cn(
                      "mx-1.5 h-px w-5 shrink-0 transition-colors duration-300",
                      isCompleted || isActive ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => !isLocked && goToStep(step.id)}
                  disabled={isLocked}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "bg-[#0a1628] text-[#FAF7F2] shadow-sm"
                      : isCompleted
                        ? "bg-[#C9A96E]/18 text-[#0a1628] hover:bg-[#C9A96E]/28"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted",
                    isLocked && "cursor-not-allowed opacity-40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-[#FAF7F2]"
                        : isCompleted
                          ? "bg-[#C9A96E] text-[#0a1628]"
                          : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-2.5 w-2.5" /> : step.id}
                  </span>
                  <span>{step.short}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
