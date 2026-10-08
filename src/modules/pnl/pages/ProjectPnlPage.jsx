import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import DashboardHeader from "@/modules/super-admin/components/DashboardHeader";
import { PageShell, StatTile, Surface } from "@/components/layout/PageShell";
import LoadingPanel from "@/components/shared/LoadingPanel";
import { loadingMessages } from "@/components/shared/loadingMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  downloadBlob,
  exportProjectPnl,
  fetchProjectPnl,
} from "@/modules/pnl/api/pnl.api";
import { formatAed } from "@/shared/utils/currency";

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function periodFilename(mode, yearMonth, day, from, to) {
  if (mode === "day") return day || "day";
  if (mode === "range") return `${from || "from"}_to_${to || "to"}`;
  return yearMonth || "month";
}

export default function ProjectPnlPage({ backHref, backLabel = "Back to P&L" }) {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const initialMonth = searchParams.get("yearMonth") || currentYearMonth();

  const [mode, setMode] = useState("month");
  const [yearMonth, setYearMonth] = useState(initialMonth);
  const [day, setDay] = useState(todayIso());
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const query = useMemo(() => {
    if (mode === "day") {
      return { from: day, to: day };
    }
    if (mode === "range") {
      return { from, to };
    }
    return { yearMonth };
  }, [mode, yearMonth, day, from, to]);

  const load = useCallback(async () => {
    if (!projectId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const pnl = await fetchProjectPnl(projectId, { ...query, signal: controller.signal });
      if (controller.signal.aborted) return;
      setData(pnl);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError(err?.response?.data?.message || err?.message || "Failed to load project P&L");
      setData(null);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [projectId, query]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const exportFile = async (format) => {
    try {
      const blob = await exportProjectPnl(projectId, format, query);
      const stamp = periodFilename(mode, yearMonth, day, from, to);
      downloadBlob(blob, `project-${projectId}-pnl-${stamp}.${format}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Export failed");
    }
  };

  const periodLabel = data?.periodFrom && data?.periodTo
    ? data.periodFrom === data.periodTo
      ? data.periodFrom
      : `${data.periodFrom} → ${data.periodTo}`
    : data?.periodYearMonth || "—";

  return (
    <PageShell>
      <DashboardHeader
        title={data?.projectName ? `P&L — ${data.projectName}` : "Project Profit & Loss"}
        description="Per-project cost breakdown and margin versus original estimate."
      >
        <div className="flex flex-wrap items-center gap-2">
          {backHref && (
            <Button asChild size="sm" variant="outline">
              <Link to={backHref}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {backLabel}
              </Link>
            </Button>
          )}
          <select
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            aria-label="Period mode"
          >
            <option value="month">Month</option>
            <option value="day">Day</option>
            <option value="range">Date range</option>
          </select>
          {mode === "month" && (
            <Input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-[160px]"
            />
          )}
          {mode === "day" && (
            <Input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-[160px]"
            />
          )}
          {mode === "range" && (
            <>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-[150px]"
                aria-label="From date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-[150px]"
                aria-label="To date"
              />
            </>
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
        <LoadingPanel size="section" messages={loadingMessages.finance} />
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
            {(mode === "day" || mode === "range") && (
              <p className="text-xs text-muted-foreground">
                Materials and SC certified costs are filtered to the selected dates.
                Contract, variation and overhead use the current project commercial position.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>Materials<br /><strong>{formatAed(data.materialCost)}</strong></div>
              <div>SC certified<br /><strong>{formatAed(data.scCertifiedCost)}</strong></div>
              <div>Variation cost<br /><strong>{formatAed(data.variationCost)}</strong></div>
              <div>Overhead allocated<br /><strong>{formatAed(data.overheadAllocated)}</strong></div>
              <div>Labour (not tracked yet)<br /><strong>{formatAed(data.labourCost)}</strong></div>
              <div>Period<br /><strong>{periodLabel}</strong></div>
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
