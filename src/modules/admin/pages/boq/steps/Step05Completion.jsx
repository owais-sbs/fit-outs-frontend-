import { useEffect } from "react";
import { CheckCircle2, RotateCcw, FileSpreadsheet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBoq, QAS_TOTAL_STEPS, QAS_STATUS } from "../BoqEngine";
import QasSummaryStats from "../QasSummaryStats";
import { getQasStats } from "../boqDataUtils";

export default function Step05Completion() {
  const { session, floors, rooms, completeSession, resetSession, prevStep, goToStep } = useBoq();

  useEffect(() => {
    if (session?.status !== QAS_STATUS.COMPLETED) {
      completeSession();
    }
  }, [session?.status, completeSession]);

  const stats = getQasStats(floors, rooms);

  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center py-4">
      <div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">5</span>
          Step 5 of {QAS_TOTAL_STEPS}
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

      <QasSummaryStats stats={stats} />

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button variant="outline" onClick={prevStep}>
          Back to Review
        </Button>
        <Button
          onClick={() => goToStep(6)}
          disabled={stats.workItems === 0}
          className="gap-2 bg-primary text-white hover:bg-primary/90"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Generate BOQ
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={resetSession} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Start New QAS
        </Button>
      </div>

      {stats.workItems === 0 && (
        <p className="text-xs text-amber-700">Add work items in Step 3 to enable BOQ generation.</p>
      )}
    </div>
  );
}
