import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import LeadCard from "./LeadCard";

export default function PipelineColumn({ column, leads, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex w-[280px] shrink-0 flex-col md:w-[300px]">
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 backdrop-blur-sm">
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <span className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-2 transition-colors",
          isOver && "border-primary/40 bg-primary/5"
        )}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
