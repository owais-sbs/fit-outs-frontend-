import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, Package, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  fetchMaterialPlan,
  generateMaterialPlan,
  updateMaterialPlan,
  reserveMaterialPlan,
  exportMaterialPlanCsv,
} from "../../api/material-plan.api";
import { ROUTES } from "@/shared/constants/routes";

export default function MaterialPlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const isPm = location.pathname.startsWith("/project-manager");
  const detailPath = (isPm ? ROUTES.PROJECT_MANAGER.PROJECT_DETAIL : ROUTES.ADMIN.PROJECT_DETAIL)
    .replace(":projectId", projectId);

  const [plan, setPlan] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(() => {
    setLoading(true);
    fetchMaterialPlan(projectId)
      .then((data) => {
        setPlan(data);
        setLines(Array.isArray(data?.lines) ? data.lines.map((l) => ({ ...l })) : []);
        setDirty(false);
      })
      .catch(() => {
        setPlan(null);
        setLines([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    setMessage("");
    try {
      const data = await fn();
      if (data?.lines) {
        setPlan(data);
        setLines(data.lines.map((l) => ({ ...l })));
        setDirty(false);
      } else if (data) {
        setPlan(data);
      } else {
        await load();
      }
      if (okMsg) setMessage(okMsg);
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const patchLine = (index, patch) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  const linePayload = () =>
    lines.map((l) => ({
      materialId: l.materialId,
      materialName: l.materialName,
      plannedQty: l.plannedQty,
      stockQtySnapshot: l.stockQtySnapshot,
      unit: l.unit,
      shortageFlag: l.shortageFlag,
      reservedQty: l.reservedQty,
      notes: l.notes,
      substituteReason: l.substituteReason,
      sortOrder: l.sortOrder,
    }));

  const handleGenerate = () => run(() => generateMaterialPlan(projectId), "Plan generated from BOQ");
  const handleSave = () =>
    run(
      () =>
        updateMaterialPlan(projectId, {
          status: plan?.status || "DRAFT",
          lines: linePayload(),
        }),
      "Lines saved"
    );
  const handleReady = () =>
    run(
      () =>
        updateMaterialPlan(projectId, {
          status: "READY",
          lines: linePayload(),
        }),
      "Marked READY"
    );
  const handleReserve = () =>
    run(async () => {
      const data = await reserveMaterialPlan(projectId);
      const reservedLines = Array.isArray(data?.lines) ? data.lines : lines;
      const totalReserved = reservedLines.reduce(
        (sum, l) => sum + (Number(l.reservedQty) || 0),
        0
      );
      const softHeld = reservedLines.filter((l) => Number(l.reservedQty) > 0).length;
      setToast({
        type: "success",
        title: "Stock soft-held",
        message: `${softHeld} line(s) reserved · ${totalReserved} total qty soft-held on stock`,
      });
      return data;
    }, "Materials reserved (soft hold)");
  const handleExport = () =>
    run(async () => {
      try {
        await exportMaterialPlanCsv(projectId);
      } catch {
        const base = process.env.REACT_APP_API_BASE_URL || "/api";
        window.open(
          `${String(base).replace(/\/$/, "")}/projects/${projectId}/material-plan/export.csv`,
          "_blank",
          "noopener,noreferrer"
        );
      }
    }, "CSV download started");

  if (loading) {
    return (
      <PageShell className="max-w-5xl mx-auto flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-5xl mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <h4 className="text-xs font-bold">{toast.title}</h4>
          <p className="text-[11px] opacity-90">{toast.message}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Link to={detailPath}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageTitle
          className="flex-1"
          title="Material Plan"
          subtitle={`Project #${projectId}`}
          actions={plan?.status ? (
            <Badge className="border-none bg-primary/10 text-primary">{plan.status}</Badge>
          ) : null}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleGenerate} disabled={busy}>
          <RefreshCw className="h-4 w-4 mr-1" /> Generate from BOQ
        </Button>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={busy || !dirty}>
          <Save className="h-4 w-4 mr-1" /> Save lines
        </Button>
        <Button size="sm" variant="outline" onClick={handleReady} disabled={busy || !plan}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark READY
        </Button>
        <Button size="sm" variant="secondary" onClick={handleReserve} disabled={busy || !plan}>
          <Package className="h-4 w-4 mr-1" /> Reserve stock
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={busy || !plan}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Plan lines ({lines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No lines yet. Generate from an approved BOQ to populate.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {lines.map((line, i) => (
                <div key={line.uuid || i} className="grid gap-3 py-3 sm:grid-cols-12 sm:items-start">
                  <div className="sm:col-span-3 min-w-0">
                    <p className="text-sm font-medium">{line.materialName || "Material"}</p>
                    <p className="text-xs text-muted-foreground">{line.unit || "—"}</p>
                    {line.shortageFlag && (
                      <Badge variant="destructive" className="text-[10px] mt-1">Shortage</Badge>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground">Planned qty</p>
                    <Input
                      type="number"
                      className="h-8"
                      value={line.plannedQty ?? ""}
                      onChange={(e) =>
                        patchLine(i, {
                          plannedQty: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2 text-sm tabular-nums pt-5">
                    <span className="text-muted-foreground text-xs mr-1">Stock</span>
                    {line.stockQtySnapshot ?? 0}
                    <span className="text-muted-foreground text-xs mx-2">·</span>
                    <span className="text-muted-foreground text-xs mr-1">Res</span>
                    {line.reservedQty ?? 0}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground">Notes</p>
                    <Input
                      className="h-8"
                      value={line.notes || ""}
                      onChange={(e) => patchLine(i, { notes: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground">Substitute reason</p>
                    <Input
                      className="h-8"
                      value={line.substituteReason || ""}
                      onChange={(e) => patchLine(i, { substituteReason: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
