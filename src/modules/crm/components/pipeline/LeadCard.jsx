import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PRIORITY_VARIANT = { high: "destructive", medium: "warning", low: "secondary" };

export default function LeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials = lead.assignee
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all hover:border-primary/25 hover:shadow-md",
        isDragging && "opacity-60 ring-2 ring-primary/30"
      )}
      onClick={onClick}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          type="button"
          className="touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag lead">
          <GripVertical className="h-4 w-4" />
        </button>
        <Badge variant={PRIORITY_VARIANT[lead.priority] || "secondary"} className="text-[10px]">
          {lead.priority}
        </Badge>
      </div>
      <p className="font-semibold text-sm leading-tight">{lead.clientName}</p>
      <p className="text-xs text-muted-foreground">{lead.company}</p>
      <p className="mt-2 text-sm font-medium text-primary">
        ${(lead.budget / 1000).toFixed(0)}k
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-[10px] text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground">{lead.assignee.split(" ")[0]}</span>
        </div>
        {lead.followUp !== "—" && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {lead.followUp.slice(5)}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{lead.source}</p>
    </div>
  );
}
