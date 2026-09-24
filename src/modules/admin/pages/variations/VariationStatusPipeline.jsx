import { Check } from "lucide-react";

const STEPS = [
  ["AWAITING_TRIAGE", "Triage"],
  ["DRAFT", "Draft"],
  ["INTERNAL_REVIEW", "Internal review"],
  ["ISSUED_TO_CLIENT", "Client review"],
  ["APPROVED", "Approved"],
];

export default function VariationStatusPipeline({ status }) {
  const revisedStatus = status === "REVISED" ? "DRAFT" : status;
  const active = STEPS.findIndex(([key]) => key === revisedStatus);
  const terminal = ["REJECTED", "CANCELLED"].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={`Variation status: ${status}`}>
      {STEPS.map(([key, label], index) => {
        const done = !terminal && active >= index;
        return (
          <div key={key} className="flex items-center">
            <div className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
              done ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
            }`}>
              {active > index && <Check className="h-3 w-3" />}
              {label}
            </div>
            {index < STEPS.length - 1 && <span className="mx-1 h-px w-3 bg-border" />}
          </div>
        );
      })}
      {terminal && (
        <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {status?.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
}
