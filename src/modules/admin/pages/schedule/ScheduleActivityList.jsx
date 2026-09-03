import { Badge } from "@/components/ui/badge";
import { GanttChart } from "lucide-react";

export default function ScheduleActivityList({ activities, selectedUuid, onSelect, roomTaskPath }) {
  const sorted = [...(activities || [])].sort((a, b) =>
    String(a.startDate).localeCompare(String(b.startDate))
  );

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        No activities yet. Add one below.
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:hidden">
      {sorted.map((a) => {
        const pct = Math.min(100, Math.max(0, a.percentComplete || 0));
        const selected = selectedUuid === a.uuid;
        return (
          <button
            key={a.uuid}
            type="button"
            onClick={() => onSelect(a)}
            className={`flex w-full flex-col gap-2 rounded-2xl px-4 py-3 text-left transition ${
              selected ? "bg-accent/60 ring-1 ring-primary/25" : "bg-card shadow-sm hover:bg-secondary/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-snug">{a.name}</p>
              <Badge className="shrink-0 border-none bg-primary/10 text-primary">{pct}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {String(a.startDate).slice(0, 10)} → {String(a.endDate).slice(0, 10)}
              {a.publishStatus === "PUBLISHED" ? " · Live" : " · Draft"}
            </p>
            {(a.roomName || a.roomTaskTitle) && (
              <p className="text-[11px] text-muted-foreground">
                {a.roomName}
                {a.roomTaskTitle ? ` · ${a.roomTaskTitle}` : ""}
              </p>
            )}
            {a.roomTaskId && roomTaskPath && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                <GanttChart className="h-3 w-3" /> Linked room task
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
