import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Loader2, RefreshCw, Save } from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  downloadBlob,
  exportCompanyPnl,
  fetchCompanyPnl,
  fetchOverheadRule,
  upsertOverheadRule,
} from "@/modules/pnl/api/pnl.api";
import { formatAed } from "@/shared/utils/currency";

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function CompanyPnlPage({
  title = "Profit & Loss",
  projectPnlPath,
}) {
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [data, setData] = useState(null);
  const [overheadPct, setOverheadPct] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const load = useCallback(async (options = {}) => {
    const { refresh = false } = options;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const [pnl, rule] = await Promise.all([
        fetchCompanyPnl(yearMonth, { refresh, signal: controller.signal }),
        fetchOverheadRule({ signal: controller.signal }).catch(() => ({ percentage: 0 })),
      ]);
      if (controller.signal.aborted) return;
      setData(pnl);
      setOverheadPct(String(rule?.percentage ?? 0));
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError(err?.response?.data?.message || err?.message || "Failed to load P&L");
      setData(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [yearMonth]);

  useEffect(() => {
    load({ refresh: false });
    return () => abortRef.current?.abort();
  }, [load]);

  const projects = useMemo(
    () => (Array.isArray(data?.projects) ? data.projects : []),
    [data]
  );

  const saveOverhead = async () => {
    setSaving(true);
    try {
      await upsertOverheadRule({ percentage: Number(overheadPct) || 0 });
      await load({ refresh: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save overhead");
    } finally {
      setSaving(false);
    }
  };

  const exportFile = async (format) => {
    try {
      const blob = await exportCompanyPnl(format, yearMonth);
      downloadBlob(blob, `company-pnl-${yearMonth}.${format}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Export failed");
    }
  };

  return (
    <PageShell>
      <DashboardHeader
        title={title}
        description="Contract value minus materials, SC certified, variation cost and overhead. Labour not tracked yet."
      >
        <div className="flex flex-wrap gap-2">
          <Input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="w-[160px]"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => load({ refresh: true })}
            disabled={loading}
          >
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading P&L…
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Contract value" value={formatAed(data?.contractValue)} />
            <StatTile label="Total cost" value={formatAed(data?.totalCost)} />
            <StatTile label="Margin" value={formatAed(data?.margin)} />
            <StatTile
              label="Margin %"
              value={data?.marginPercent != null ? `${data.marginPercent}%` : "—"}
            />
          </div>

          <Surface className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Cost breakdown (company)</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
              <div>Materials<br /><strong>{formatAed(data?.materialCost)}</strong></div>
              <div>SC certified<br /><strong>{formatAed(data?.scCertifiedCost)}</strong></div>
              <div>Variation cost<br /><strong>{formatAed(data?.variationCost)}</strong></div>
              <div>Overhead<br /><strong>{formatAed(data?.overheadAllocated)}</strong></div>
              <div>Labour (not tracked)<br /><strong>{formatAed(data?.labourCost)}</strong></div>
            </div>
          </Surface>

          <Surface className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Overhead rule</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="oh">% of contract value</Label>
                <Input
                  id="oh"
                  type="number"
                  min="0"
                  step="0.01"
                  value={overheadPct}
                  onChange={(e) => setOverheadPct(e.target.value)}
                  className="w-[140px]"
                />
              </div>
              <Button size="sm" onClick={saveOverhead} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </Surface>

          <Surface className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Contract</TableHead>
                  <TableHead className="text-right">Total cost</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No P&L snapshots for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((row) => (
                    <TableRow key={row.projectId}>
                      <TableCell className="font-medium">{row.projectName || row.projectId}</TableCell>
                      <TableCell className="text-right">{formatAed(row.contractValue)}</TableCell>
                      <TableCell className="text-right">{formatAed(row.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatAed(row.margin)}</TableCell>
                      <TableCell className="text-right">
                        {row.marginPercent != null ? `${row.marginPercent}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {projectPnlPath && (
                          <Button asChild size="sm" variant="outline">
                            <Link to={projectPnlPath(row.projectId)}>Detail</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Surface>
        </>
      )}
    </PageShell>
  );
}
