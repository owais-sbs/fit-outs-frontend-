import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  GripVertical,
  Phone,
  Building2,
  MapPin,
  MoreHorizontal,
  Eye,
  Pencil,
  CalendarPlus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const PRIORITY_VARIANT = {
  high:   "destructive",
  High:   "destructive",
  medium: "warning",
  Medium: "warning",
  low:    "secondary",
  Low:    "secondary",
};

export default function LeadCard({ lead, onClick, onEdit, onFollowUp, onScheduleVisit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { lead } });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const initials = lead.assignee
    ? lead.assignee.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-pointer rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
        isDragging && "opacity-60 ring-2 ring-primary/40 shadow-lg"
      )}
      onClick={onClick}
    >
      {/* Top row: drag + priority + menu */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag lead"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <Badge
            variant={PRIORITY_VARIANT[lead.priority] || "secondary"}
            className="text-[10px] px-1.5 py-0 capitalize"
          >
            {lead.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <Eye className="mr-2 h-3.5 w-3.5" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFollowUp?.(); }}>
                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                Add follow-up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScheduleVisit?.(); }}>
                <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                Schedule visit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Client name + company */}
      <p className="font-semibold text-sm leading-tight">{lead.clientName}</p>
      {lead.company && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Building2 className="h-3 w-3 shrink-0" />
          {lead.company}
        </p>
      )}

      {/* Project type */}
      {lead.projectType && (
        <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0">
          {lead.projectType}
        </Badge>
      )}

      {/* Budget */}
      <p className="mt-2 text-sm font-semibold text-primary">
        ${(lead.budget / 1000).toFixed(0)}k
      </p>

      {/* Location */}
      {lead.location && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {lead.location}
        </p>
      )}

      {/* Phone */}
      {lead.phone && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          {lead.phone}
        </p>
      )}

      {/* Footer: assignee + follow-up + source */}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="bg-primary/10 text-[9px] text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground">
            {lead.assignee?.split(" ")[0]}
          </span>
        </div>
        {lead.followUp && lead.followUp !== "—" && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {lead.followUp.slice(5).replace("-", "/")}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">
        via {lead.source}
      </p>
    </div>
  );
}
