import { useEffect } from "react";
import { CheckCircle2, Building2, DoorOpen, RotateCcw, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoq, QAS_TOTAL_STEPS, QAS_STATUS } from "../BoqEngine";

export default function Step05Completion() {
  const { session, floors, rooms, completeSession, resetSession, prevStep } = useBoq();

  useEffect(() => {
    if (session?.status !== QAS_STATUS.COMPLETED) {
      completeSession();
    }
  }, [session?.status, completeSession]);

  const wallCount = rooms.reduce((n, r) => n + (window.__boq_walls?.[r.id]?.length || 0), 0);
  const workItemCount = rooms.reduce((n, r) => {
    const walls = window.__boq_walls?.[r.id] || [];
    return n + walls.reduce((w, wall) => w + (wall.workScopeEntries?.length || 0), 0);
  }, 0);

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center py-4">
      <div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">5</span>
          Step {QAS_TOTAL_STEPS} of {QAS_TOTAL_STEPS}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">QAS Complete</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You have finished the Quantity Assessment Sheet for{" "}
            <span className="font-semibold text-foreground">
              {session?.project?.projectName || session?.project?.name || "this project"}
            </span>
            . All rooms, walls, and work items have been captured.
          </p>
        </div>
        {session?.ref && (
          <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
            {session.ref}
          </Badge>
        )}
      </div>

      <Card className="border-emerald-200/60 bg-emerald-50/30 text-left">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-foreground">Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
              <Building2 className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{floors.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Floors</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
              <DoorOpen className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{rooms.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rooms</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{wallCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Walls</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{workItemCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Work Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button variant="outline" onClick={prevStep}>
          Back to Review
        </Button>
        <Button onClick={resetSession} className="gap-2 bg-primary text-white hover:bg-primary/90">
          <RotateCcw className="h-4 w-4" />
          Start New QAS
        </Button>
      </div>
    </div>
  );
}
