import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchFinalReport } from "@/modules/admin/api/room-collab.api";
import { fetchPublishedProjectSchedule } from "@/modules/admin/api/schedule.api";
import { fetchBillingMilestones } from "@/modules/admin/api/billing.api";
import { downloadFinalApprovedPdf } from "@/modules/admin/pages/roomcollab/finalReportPdf";

/**
 * Downloads the same Final PDF used on client/admin rooms sections
 * (room approvals + construction progress >1% + payment progress).
 */
export default function FinalProjectPdfButton({
  projectId,
  projectName,
  size = "sm",
  variant = "outline",
  className,
  label = "Final PDF",
}) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (!projectId || exporting) return;
    setExporting(true);
    setError("");
    try {
      const [report, schedule, milestones] = await Promise.all([
        fetchFinalReport(projectId),
        fetchPublishedProjectSchedule(projectId).catch(() => null),
        fetchBillingMilestones(projectId).catch(() => []),
      ]);
      await downloadFinalApprovedPdf(report, projectName, {
        schedule,
        milestones: Array.isArray(milestones) ? milestones : [],
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={className}>
      <Button type="button" size={size} variant={variant} disabled={exporting || !projectId} onClick={handleClick}>
        {exporting ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-1 h-4 w-4" />
        )}
        {label}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
