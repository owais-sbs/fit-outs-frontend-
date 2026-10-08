import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchFinalProjectReport } from "@/modules/admin/api/final-project-report.api";
import { openFinalProjectReportPdf } from "@/modules/admin/pages/roomcollab/finalProjectReportPdf";

/**
 * Builds a live final project report for the open project and opens the PDF.
 */
export default function FinalProjectPdfButton({
  projectId,
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
      const report = await fetchFinalProjectReport(projectId);
      await openFinalProjectReportPdf(report);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || "PDF export failed");
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
