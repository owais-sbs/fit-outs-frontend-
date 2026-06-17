import { Building2, DoorOpen, Layers, Wrench } from "lucide-react";
import { ClipboardCheck } from "lucide-react";

const STAT_ITEMS = [
  { key: "floors", label: "Floors", icon: Building2 },
  { key: "rooms", label: "Rooms", icon: DoorOpen },
  { key: "walls", label: "Walls", icon: Layers },
  { key: "workItems", label: "Work Items", icon: Wrench },
];

export default function QasSummaryStats({ stats, title = "Summary", className = "" }) {
  return (
    <div className={`rounded-xl border border-emerald-200/60 bg-emerald-50/30 text-left ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <h3 className="font-bold text-sm text-foreground">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_ITEMS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-lg border border-border/40 bg-background px-3 py-3 flex flex-col items-center justify-start min-h-[88px]"
            >
              <div className="h-5 w-5 flex items-center justify-center mb-1.5 shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground leading-none tabular-nums h-8 flex items-center justify-center">
                {stats?.[key] ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1.5 text-center leading-tight">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
