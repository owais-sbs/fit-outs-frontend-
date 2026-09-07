import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, Package, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fetchMaterialPlan,
  generateMaterialPlan,
  updateMaterialPlan,
  reserveMaterialPlan,
  exportMaterialPlanCsv,
} from "../../api/material-plan.api";
import { ROUTES, projectPlanningBackPath } from "@/shared/constants/routes";

function toQty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function materialLineShortage(plannedQty, stockQty) {
  return toQty(plannedQty) > toQty(stockQty);
}

function workItemLabels(line) {
  if (Array.isArray(line?.workItemNames)) {
    return line.workItemNames.map((name) => String(name).trim()).filter(Boolean);
  }
  if (typeof line?.workItemNames === "string" && line.workItemNames.trim()) {
    return line.workItemNames.split(",").map((name) => name.trim()).filter(Boolean);
  }
  return [];
}

function groupMaterialLines(lines) {
  const groups = new Map();

  lines.forEach((line, index) => {
    const labels = workItemLabels(line);
    const key = labels.length === 0 ? "__unassigned__" : labels.slice().sort().join("\0");

    if (!groups.has(key)) {
      groups.set(key, { key, labels, entries: [] });
    }
    groups.get(key).entries.push({ line, index });
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === "__unassigned__") return 1;
    if (b.key === "__unassigned__") return -1;
    return (a.labels[0] || "").localeCompare(b.labels[0] || "");
  });
}

function resolveLineIndex(lines, sectionLine) {
  if (sectionLine?.uuid) {
    const byUuid = lines.findIndex((line) => line.uuid === sectionLine.uuid);
    if (byUuid >= 0) return byUuid;
  }
  if (sectionLine?.materialId) {
    const sectionNames = workItemLabels(sectionLine).join("|").toLowerCase();
    const byMaterial = lines.findIndex((line) => {
      if (line.materialId !== sectionLine.materialId) return false;
      return workItemLabels(line).join("|").toLowerCase() === sectionNames;
    });
    if (byMaterial >= 0) return byMaterial;
  }
  return -1;
}

function buildDisplaySections(plan, lines) {
  if (Array.isArray(plan?.sections) && plan.sections.length > 0) {
    return plan.sections.map((section, index) => {
      const sectionLines = Array.isArray(section.lines) ? section.lines : [];
      const entries = sectionLines.map((line) => {
        const lineIndex = resolveLineIndex(lines, line);
        return {
          line: lineIndex >= 0 ? lines[lineIndex] : line,
          index: lineIndex,
        };
      });

      return {
        key: section.workItemId || `section-${index}-${section.workItemName || "work-item"}`,
        workItemName: section.workItemName || "Unassigned materials",
        entries,
        materialCount: sectionLines.length,
        isEmpty: sectionLines.length === 0,
      };
    });
  }

  return groupMaterialLines(lines).map((group) => ({
    key: group.key,
    workItemName: group.key === "__unassigned__" ? "Unassigned materials" : group.labels.join(" · "),
    entries: group.entries,
    materialCount: group.entries.length,
    isEmpty: group.entries.length === 0,
  }));
}

function MaterialPlanLineRow({ line, index, onPatch, readOnly = false }) {
  const handlePatch = (lineIndex, patch) => {
    if (readOnly || lineIndex < 0) return;
    onPatch(lineIndex, patch);
  };

  return (
    <div className="grid gap-3 py-3 sm:grid-cols-12 sm:items-start">
      <div className="sm:col-span-3 min-w-0">
        <p className="text-sm font-medium">{line.materialName || "Material"}</p>
        <p className="text-xs text-muted-foreground">{line.unit || "—"}</p>
        {materialLineShortage(line.plannedQty, line.stockQtySnapshot) && (
          <Badge variant="destructive" className="text-[10px] mt-1">Shortage</Badge>
        )}
      </div>
      <div className="sm:col-span-2 space-y-1">
        <p className="text-[10px] uppercase text-muted-foreground">Planned qty</p>
        <Input
          type="number"
          className="h-8"
          value={line.plannedQty ?? ""}
          disabled={readOnly}
          onChange={(e) =>
            handlePatch(index, {
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
          disabled={readOnly}
          onChange={(e) => handlePatch(index, { notes: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3 space-y-1">
        <p className="text-[10px] uppercase text-muted-foreground">Substitute reason</p>
        <Input
          className="h-8"
          value={line.substituteReason || ""}
          disabled={readOnly}
          onChange={(e) => handlePatch(index, { substituteReason: e.target.value })}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

export default function MaterialPlanPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [plan, setPlan] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);

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
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if ("plannedQty" in patch) {
          next.shortageFlag = materialLineShortage(next.plannedQty, next.stockQtySnapshot);
        }
        return next;
      })
    );
  };

  const linePayload = () =>
    lines.map((l, idx) => {
      const plannedQty = l.plannedQty === "" || l.plannedQty == null ? 0 : l.plannedQty;
      const stockQtySnapshot = l.stockQtySnapshot ?? 0;
      return {
        materialId: l.materialId,
        materialName: l.materialName,
        workItemNames: workItemLabels(l),
        plannedQty,
        stockQtySnapshot,
        unit: l.unit,
        shortageFlag: materialLineShortage(plannedQty, stockQtySnapshot),
        reservedQty: l.reservedQty,
        notes: l.notes,
        substituteReason: l.substituteReason,
        sortOrder: l.sortOrder ?? idx,
      };
    });

  const handleGenerate = () =>
    run(async () => {
      const data = await generateMaterialPlan(projectId);
      const count = Array.isArray(data?.lines) ? data.lines.length : 0;
      const sectionCount = Array.isArray(data?.sections) ? data.sections.length : 0;
      const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
      if (sectionCount > 0 && count > 0) {
        setMessage(
          `Generated ${count} material line${count === 1 ? "" : "s"} across ${sectionCount} work item${sectionCount === 1 ? "" : "s"}.`
        );
      } else if (sectionCount > 0) {
        setMessage(
          warnings.length > 0
            ? `Loaded ${sectionCount} work item${sectionCount === 1 ? "" : "s"} from BOQ. ${warnings[0]}`
            : `Loaded ${sectionCount} work item${sectionCount === 1 ? "" : "s"} from BOQ.`
        );
      } else if (warnings.length > 0) {
        setMessage(warnings.join(" "));
      } else {
        setMessage("No material lines could be generated. Ensure the project has an approved BOQ with work items that have materials configured.");
      }
      return data;
    });
  const handleSave = () =>
    run(async () => {
      const data = await updateMaterialPlan(projectId, {
        status: plan?.status || "DRAFT",
        lines: linePayload(),
      });
      const saved = Array.isArray(data?.lines) ? data.lines : [];
      const shortageCount = saved.filter((l) => l.shortageFlag).length;
      setMessage(
        shortageCount > 0
          ? `Plan saved. ${shortageCount} line${shortageCount === 1 ? "" : "s"} flagged as shortage.`
          : "Plan saved. All lines are covered by current stock."
      );
      return data;
    });
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

  const groupedLines = buildDisplaySections(plan, lines);
  const hasWorkItemSections = groupedLines.length > 0;

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
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title={`Back to ${backLabel}`}>
          <Link to={backPath}><ArrowLeft className="h-4 w-4" /></Link>
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
        <Button size="sm" variant="outline" onClick={handleSave} disabled={busy || lines.length === 0}>
          <Save className="h-4 w-4 mr-1" /> Save plan
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

      {message && (
        <p className={`text-sm ${lines.length === 0 && message.includes("No ") ? "text-amber-700" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {hasWorkItemSections
              ? `Work items (${groupedLines.length}) · ${lines.length} material line${lines.length === 1 ? "" : "s"}`
              : `Plan lines (${lines.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasWorkItemSections ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No lines yet. Generate from an approved BOQ to populate.
            </p>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={groupedLines.map((group) => group.key)}
              className="space-y-3"
            >
              {groupedLines.map((group) => (
                <AccordionItem
                  key={group.key}
                  value={group.key}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <AccordionTrigger
                    className="bg-muted px-4 py-3 hover:no-underline hover:bg-muted/80 data-[state=open]:border-b data-[state=open]:border-border [&>svg]:text-muted-foreground"
                  >
                    <div className="min-w-0 flex-1 pr-3 text-left">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Work item
                      </p>
                      <p className="text-sm font-semibold leading-snug mt-0.5 text-foreground">
                        {group.workItemName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.isEmpty
                          ? "No materials configured"
                          : `${group.materialCount} material${group.materialCount === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-background px-4 pb-1">
                    {group.isEmpty ? (
                      <p className="py-4 text-sm text-muted-foreground">
                        No materials are configured for this work item in Project Configuration.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {group.entries.map(({ line, index }) => (
                          <MaterialPlanLineRow
                            key={line.uuid || `${group.key}-${index}`}
                            line={line}
                            index={index}
                            onPatch={patchLine}
                            readOnly={index < 0}
                          />
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
