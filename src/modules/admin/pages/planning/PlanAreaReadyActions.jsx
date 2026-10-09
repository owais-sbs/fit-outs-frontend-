import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { fetchPlanningStatus, updatePlanningStatus } from "../../api/planning.api";

const STATUS_BADGE = {
  NOT_REQUIRED: "bg-secondary text-muted-foreground",
  NOT_STARTED: "bg-sky-500/15 text-sky-800",
  IN_PROGRESS: "bg-sky-500/15 text-sky-800",
  READY: "bg-[#C9A96E]/20 text-[#8a6d3b]",
  DRAFT: "bg-sky-500/15 text-sky-800",
};

const STATUS_LABEL = {
  NOT_REQUIRED: "Not required",
  NOT_STARTED: "In Progress",
  IN_PROGRESS: "In Progress",
  READY: "Ready",
  DRAFT: "In Progress",
};

/**
 * Mark READY / reopen for a planning area (resource, labour, subcontractor).
 * Writes to PUT /projects/:id/planning so ScheduleReadinessStrip + Gantt gates update.
 */
export default function PlanAreaReadyActions({
  projectId,
  statusKey,
  archived = false,
  className,
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!projectId || !statusKey) return;
    setLoading(true);
    fetchPlanningStatus(projectId)
      .then((data) => setStatus(data?.[statusKey] || "IN_PROGRESS"))
      .catch(() => setStatus("IN_PROGRESS"))
      .finally(() => setLoading(false));
  }, [projectId, statusKey]);

  useEffect(() => {
    load();
  }, [load]);

  const setAreaStatus = async (next) => {
    if (archived || busy || !projectId || !statusKey) return;
    setBusy(true);
    try {
      const updated = await updatePlanningStatus(projectId, { [statusKey]: next });
      setStatus(updated?.[statusKey] || next);
      notify.success(next === "READY" ? "Marked READY" : "Plan reopened");
    } catch (e) {
      notify.error(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const isReady = status === "READY";
  const label = STATUS_LABEL[status] || "In Progress";

  return (
    <div className={cn("ml-auto flex flex-wrap items-center gap-2", className)}>
      {!loading && status ? (
        <Badge className={cn("border-none", STATUS_BADGE[status] || STATUS_BADGE.IN_PROGRESS)}>
          {label}
        </Badge>
      ) : null}
      {isReady ? (
        <Button
          size="sm"
          variant="outline"
          className="min-h-11 md:min-h-9"
          onClick={() => setAreaStatus("IN_PROGRESS")}
          disabled={busy || archived || loading}
        >
          <Pencil className="mr-1 h-4 w-4" /> Edit (reopen)
        </Button>
      ) : (
        <Button
          size="sm"
          className="min-h-11 border-0 bg-[#C9A96E] text-[#0a1628] hover:bg-[#b8955a] hover:text-[#0a1628] md:min-h-9"
          onClick={() => setAreaStatus("READY")}
          disabled={busy || archived || loading}
        >
          <CheckCircle2 className="mr-1 h-4 w-4" /> Mark READY
        </Button>
      )}
    </div>
  );
}
