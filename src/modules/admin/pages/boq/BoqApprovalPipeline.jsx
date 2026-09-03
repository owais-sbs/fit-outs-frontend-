import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const BOQ_PIPELINE_STEPS = [
  { key: "SENIOR_QS", label: "Senior QS", short: "SQS", pending: "PENDING_SENIOR_QS" },
  { key: "PM", label: "PM", short: "PM", pending: "PENDING_PM" },
  { key: "PD", label: "PD", short: "PD", pending: "PENDING_DIRECTOR" },
  { key: "CLIENT", label: "Client", short: "Client", pending: "PENDING_CLIENT" },
];

const PENDING_INDEX = {
  PENDING_SENIOR_QS: 0,
  PENDING_PM: 1,
  PENDING_DIRECTOR: 2,
  PENDING_CLIENT: 3,
};

export function pipelineStepState(status, index) {
  const s = String(status || "").toUpperCase().replace(/-/g, "_");
  if (s === "OBSOLETE") return "obsolete";
  if (s === "APPROVED" || s === "FINAL") return "done";
  const current = PENDING_INDEX[s];
  if (current == null) return "upcoming";
  if (index < current) return "done";
  if (index === current) return "current";
  return "upcoming";
}

function StepDot({ state, compact }) {
  const size = compact ? "h-4 w-4 text-[9px]" : "h-6 w-6 text-[11px]";
  if (state === "done") {
    return (
      <span className={cn("inline-flex items-center justify-center rounded-full bg-emerald-600 text-white", size)}>
        <Check className={compact ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary ring-2 ring-primary/30 ring-offset-1",
          compact ? "h-4 w-4" : "h-6 w-6"
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-background",
        size,
        state === "obsolete" ? "border-muted-foreground/30 text-muted-foreground/40" : "border-muted-foreground/40 text-muted-foreground"
      )}
    />
  );
}

export default function BoqApprovalPipeline({ status, compact = false, className = "" }) {
  const s = String(status || "").toUpperCase();
  const obsolete = s === "OBSOLETE";

  return (
    <div className={cn("print:hidden", className)} aria-label="BOQ approval checkpoints">
      <ol className="flex items-start">
        {BOQ_PIPELINE_STEPS.map((step, index) => {
          const state = pipelineStepState(status, index);
          const last = index === BOQ_PIPELINE_STEPS.length - 1;
          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-start">
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <StepDot state={state} compact={compact} />
                <span
                  className={cn(
                    "mt-1 leading-tight",
                    compact ? "text-[9px]" : "text-[11px] font-medium",
                    state === "current" && "text-primary font-semibold",
                    state === "done" && "text-emerald-700",
                    state === "upcoming" && "text-muted-foreground",
                    state === "obsolete" && "text-muted-foreground/50"
                  )}
                >
                  {compact ? step.short : step.label}
                </span>
              </div>
              {!last && (
                <div
                  className={cn(
                    "mt-2 h-px flex-1 min-w-[8px] sm:min-w-[16px]",
                    compact ? "mt-1.5" : "mt-3",
                    state === "done" ? "bg-emerald-500" : "bg-border",
                    obsolete && "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
      {obsolete && (
        <p className={cn("text-muted-foreground", compact ? "mt-1 text-[10px]" : "mt-2 text-xs")}>
          Replaced by a newer version
        </p>
      )}
    </div>
  );
}
