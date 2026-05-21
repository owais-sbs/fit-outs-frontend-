import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PIPELINE_COLUMNS, INITIAL_LEADS } from "../data/leads";
import PipelineColumn from "../components/pipeline/PipelineColumn";
import LeadCard from "../components/pipeline/LeadCard";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getLeadById } from "../data/leads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function findColumn(leadsState, leadId) {
  return Object.keys(leadsState).find((col) =>
    leadsState[col].some((l) => l.id === leadId)
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [activeId, setActiveId] = useState(null);
  const [previewLead, setPreviewLead] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeLead = activeId
    ? Object.values(leads)
        .flat()
        .find((l) => l.id === activeId)
    : null;

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeCol = findColumn(leads, active.id);
    let overCol = over.id;
    if (!PIPELINE_COLUMNS.find((c) => c.id === overCol)) {
      overCol = findColumn(leads, over.id);
    }
    if (!activeCol || !overCol || activeCol === overCol) return;

    setLeads((prev) => {
      const lead = prev[activeCol].find((l) => l.id === active.id);
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter((l) => l.id !== active.id),
        [overCol]: [...prev[overCol], lead],
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM pipeline"
        description="Drag leads across stages — New through Won and Lost."
        actions={
          <Button size="sm" onClick={() => navigate(ROUTES.CRM.LEADS_NEW)}>
            Add lead
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => (
            <PipelineColumn
              key={col.id}
              column={col}
              leads={leads[col.id] || []}
              onLeadClick={(id) => {
                const lead = getLeadById(id);
                if (lead) setPreviewLead(lead);
              }}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? (
            <div className="w-[280px] rotate-2 opacity-95">
              <LeadCard lead={activeLead} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Sheet open={!!previewLead} onOpenChange={(o) => !o && setPreviewLead(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{previewLead?.clientName}</SheetTitle>
          </SheetHeader>
          {previewLead && (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-muted-foreground">{previewLead.company}</p>
              <p><span className="text-muted-foreground">Budget:</span> ${previewLead.budget.toLocaleString()}</p>
              <Badge>{previewLead.stage}</Badge>
              <Button
                className="w-full"
                onClick={() =>
                  navigate(ROUTES.CRM.LEAD_DETAIL.replace(":leadId", previewLead.id))
                }>
                Open lead detail
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
