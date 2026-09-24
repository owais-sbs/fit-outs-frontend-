import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  exportProjectPnl,
  fetchProjectPnl,
} from "@/modules/pnl/api/pnl.api";
import { formatAed } from "@/shared/utils/currency";

export default function ProjectPnlPage({ backHref, backLabel = "Back to P&L" }) {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      setData(await fetchProjectPnl(projectId));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load project P&L");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const exportFile = async (format) => {
    try {
      const blob = await exportProjectPnl(projectId, format);
      downloadBlob(blob, `project-${projectId}-pnl.${format}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Export failed");
    }
  };

  return (
    <PageShell>
      <DashboardHeader
        title={data?.projectName ? `P&L — ${data.projectName}` : "Project Profit & Loss"}
        description="Per-project cost breakdown and margin versus original estimate."
      >
        <div className="flex flex-wrap gap-2">
          {backHref && (
            <Button asChild size="sm" variant="outline">
              <Link to={backHref}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportFile("csv")}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportFile("pdf")}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </DashboardHeader>

      {error && (
        <Surface className="p-3 text-sm text-destructive">{error}</Surface>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Contract value" value={formatAed(data.contractValue)} />
            <StatTile label="Total cost" value={formatAed(data.totalCost)} />
            <StatTile label="Margin" value={formatAed(data.margin)} />
            <StatTile
              label="Margin %"
              value={data.marginPercent != null ? `${data.marginPercent}%` : "—"}
            />
          </div>

          <Surface className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Cost lines</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>Materials<br /><strong>{formatAed(data.materialCost)}</strong></div>
              <div>SC certified<br /><strong>{formatAed(data.scCertifiedCost)}</strong></div>
              <div>Variation cost<br /><strong>{formatAed(data.variationCost)}</strong></div>
              <div>Overhead allocated<br /><strong>{formatAed(data.overheadAllocated)}</strong></div>
              <div>Labour (not tracked yet)<br /><strong>{formatAed(data.labourCost)}</strong></div>
              <div>Period<br /><strong>{data.periodYearMonth || "—"}</strong></div>
            </div>
          </Surface>

          <Surface className="p-4 space-y-2 text-sm">
            <h3 className="font-semibold">Margin vs original estimate</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>Original contract<br /><strong>{formatAed(data.originalContractValue)}</strong></div>
              <div>
                Original estimated cost<br />
                <strong>
                  {data.originalEstimatedCost != null ? formatAed(data.originalEstimatedCost) : "N/A"}
                </strong>
              </div>
              <div>
                Margin vs original<br />
                <strong>
                  {data.marginVsOriginalEstimate != null
                    ? formatAed(data.marginVsOriginalEstimate)
                    : "N/A"}
                </strong>
              </div>
            </div>
          </Surface>
        </>
      ) : null}
    </PageShell>
  );
}
