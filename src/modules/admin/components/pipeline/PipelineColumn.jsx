import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import LeadCard from "./LeadCard";

const COLUMN_COLORS = {
  new:          "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
  contacted:    "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400",
  qualified:    "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
  siteVisit:    "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400",
  proposalSent: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400",
  won:          "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  lost:         "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
};

export default function PipelineColumn({ column, leads, onLeadClick, onLeadNavigate }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const navigate = useNavigate();

  const colColor = COLUMN_COLORS[column.id] || "bg-muted/40 border-border/60";
  const totalBudget = leads.reduce((s, l) => s + (l.budget || 0), 0);

  return (
    <div className="flex w-[268px] shrink-0 flex-col md:w-[285px]">
      {/* Column header */}
      <div className={cn(
        "sticky top-0 z-10 mb-2 flex flex-col rounded-lg border px-3 py-2 backdrop-blur-sm",
        colColor
      )}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{column.title}</h3>
          <span className="rounded-md bg-background/60 px-2 py-0.5 text-xs font-semibold tabular-nums">
            {leads.length}
          </span>
        </div>
        {leads.length > 0 && (
          <p className="mt-0.5 text-[10px] font-medium opacity-70">
            ${(totalBudget / 1000).toFixed(0)}k pipeline
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border border-dashed border-border/50 bg-muted/15 p-2 transition-colors duration-150",
          isOver && "border-primary/50 bg-primary/5"
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick(lead.id)}
              onEdit={() => {}}
              onFollowUp={() => {}}
              onScheduleVisit={() => navigate(ROUTES.ADMIN.SITE_VISIT_SCHEDULE)}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/50 text-center">
              Drop leads here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
