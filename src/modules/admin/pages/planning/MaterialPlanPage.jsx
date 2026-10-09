import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  RefreshCw,
  CheckCircle2,
  Package,
  Download,
  Save,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Eye,
  Unlock,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import ProjectPageFrame from "@/components/layout/ProjectPageFrame";
import ProjectPathLine from "@/components/shared/ProjectPathLine";
import { rememberProjectName } from "../../hooks/useProjectName";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchMaterialPlan,
  generateMaterialPlan,
  updateMaterialPlan,
  reserveMaterialPlan,
  unreserveMaterialPlan,
  exportMaterialPlanCsv,
} from "../../api/material-plan.api";
import { fetchMaterials } from "../../api/material.api";
import { fetchProjectById } from "../../api/projects.api";
import { projectPlanningBackPath } from "@/shared/constants/routes";
import ProjectLifecycleBanner from "../../components/projects/ProjectLifecycleBanner";
import { useProjectLifecycle } from "../../hooks/useProjectLifecycle";
import { notify } from "@/lib/notify";
import PurchaseOrderTemplate from "./PurchaseOrderTemplate";
import PlanningHubSkeleton from "./PlanningHubSkeleton";
import {
  buildPoNumber,
  downloadMaterialPoPdf,
  enrichPoLines,
  dominantSupplier,
  previewMaterialPoPdf,
} from "./materialPoPdf";

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

function newClientId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  if (sectionLine?.clientKey) {
    const byKey = lines.findIndex((line) => line.clientKey === sectionLine.clientKey);
    if (byKey >= 0) return byKey;
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
    const sectionKeys = new Set();
    const fromSections = plan.sections.map((section, index) => {
      const sectionLines = Array.isArray(section.lines) ? section.lines : [];
      const entries = sectionLines.map((line) => {
        const lineIndex = resolveLineIndex(lines, line);
        return {
          line: lineIndex >= 0 ? lines[lineIndex] : line,
          index: lineIndex,
        };
      });
      // Also include locally-added lines for this work item not yet in section payload
      const workName = (section.workItemName || "").trim().toLowerCase();
      lines.forEach((line, idx) => {
        const labels = workItemLabels(line).map((n) => n.toLowerCase());
        if (workName && labels.includes(workName) && !entries.some((e) => e.index === idx)) {
          entries.push({ line, index: idx });
        }
      });
      const key = section.workItemId || `section-${index}-${section.workItemName || "work-item"}`;
      sectionKeys.add(workName);
      return {
        key,
        workItemName: section.workItemName || "Unassigned materials",
        entries,
        materialCount: entries.length,
        isEmpty: entries.length === 0,
      };
    });

    const extras = groupMaterialLines(lines).filter((g) => {
      if (g.key === "__unassigned__") return true;
      return !g.labels.some((l) => sectionKeys.has(l.toLowerCase()));
    });

    return [
      ...fromSections,
      ...extras.map((group) => ({
        key: `extra-${group.key}`,
        workItemName: group.key === "__unassigned__" ? "Unassigned materials" : group.labels.join(" · "),
        entries: group.entries,
        materialCount: group.entries.length,
        isEmpty: group.entries.length === 0,
      })),
    ];
  }

  return groupMaterialLines(lines).map((group) => ({
    key: group.key,
    workItemName: group.key === "__unassigned__" ? "Unassigned materials" : group.labels.join(" · "),
    entries: group.entries,
    materialCount: group.entries.length,
    isEmpty: group.entries.length === 0,
  }));
}

function MaterialPlanLineRow({
  line,
  index,
  onPatch,
  onDelete,
  packages,
  materials,
  readOnly = false,
}) {
  const handlePatch = (lineIndex, patch) => {
    if (readOnly || lineIndex < 0) return;
    onPatch(lineIndex, patch);
  };

  return (
    <div className="grid grid-cols-1 gap-3 py-3 md:grid-cols-12 md:items-start">
      <div className="min-w-0 space-y-1 md:col-span-3">
        <p className="text-[10px] uppercase text-muted-foreground">Material</p>
        {readOnly ? (
          <>
            <p className="text-sm font-medium">{line.materialName || "Material"}</p>
            <p className="text-xs text-muted-foreground">{line.unit || "—"}</p>
          </>
        ) : (
          <Select
            value={line.materialId ? String(line.materialId) : undefined}
            onValueChange={(id) => {
              const mat = materials.find((m) => String(m.id) === id);
              if (!mat) return;
              handlePatch(index, {
                materialId: mat.id,
                materialName: mat.materialName,
                unit: mat.unitType || line.unit,
                stockQtySnapshot: mat.quantityOnHand ?? line.stockQtySnapshot ?? 0,
              });
            }}
          >
            <SelectTrigger className="h-9 rounded-md text-xs">
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {materials.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.materialName}
                  {m.materialCode ? ` (${m.materialCode})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {materialLineShortage(line.plannedQty, line.stockQtySnapshot) && (
          <Badge variant="destructive" className="mt-1 text-[10px]">Shortage</Badge>
        )}
      </div>
      <div className="space-y-1 md:col-span-2">
        <p className="text-[10px] uppercase text-muted-foreground">Planned qty</p>
        <Input
          type="number"
          className="h-9 rounded-md"
          value={line.plannedQty ?? ""}
          disabled={readOnly}
          onChange={(e) =>
            handlePatch(index, {
              plannedQty: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      </div>
      <div className="text-sm tabular-nums md:col-span-2 md:pt-5">
        <span className="mr-1 text-xs text-muted-foreground">Stock</span>
        {line.stockQtySnapshot ?? 0}
        <span className="mx-2 text-xs text-muted-foreground">·</span>
        <span className="mr-1 text-xs text-muted-foreground">Res</span>
        {line.reservedQty ?? 0}
      </div>
      <div className="space-y-1 md:col-span-2">
        <p className="text-[10px] uppercase text-muted-foreground">Package</p>
        <Select
          value={line.packageId ? String(line.packageId) : "__none__"}
          disabled={readOnly || packages.length === 0}
          onValueChange={(v) =>
            handlePatch(index, { packageId: v === "__none__" ? null : v })
          }
        >
          <SelectTrigger className="h-9 rounded-md text-xs">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unassigned</SelectItem>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={String(pkg.id)}>
                {pkg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 md:col-span-2">
        <p className="text-[10px] uppercase text-muted-foreground">Notes</p>
        <Input
          className="h-9 rounded-md"
          value={line.notes || ""}
          disabled={readOnly}
          onChange={(e) => handlePatch(index, { notes: e.target.value })}
        />
      </div>
      <div className="flex items-end justify-start pt-1 md:col-span-1 md:justify-end md:pt-5">
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-destructive md:h-9 md:w-9"
            title="Delete line"
            onClick={() => onDelete?.(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MaterialPlanPage() {
  const { projectId } = useParams();
  const { commercialStage, archived } = useProjectLifecycle(projectId);
  const location = useLocation();
  const hubCtx = useOutletContext();
  const inHub = !!hubCtx?.inPlanningHub;
  const backPath = projectPlanningBackPath(location, projectId);
  const backLabel = location.state?.from === "detail" ? "Project" : "Schedule";

  const [plan, setPlan] = useState(null);
  const [lines, setLines] = useState([]);
  const [packages, setPackages] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [workItemsOpen, setWorkItemsOpen] = useState(true);
  const [packagesOpen, setPackagesOpen] = useState(true);
  const [expandedPackageIds, setExpandedPackageIds] = useState(() => new Set());
  const [selectedLineKeys, setSelectedLineKeys] = useState(() => new Set());
  const [newPackageName, setNewPackageName] = useState("");
  const [assignPackageId, setAssignPackageId] = useState("");
  const [addDialog, setAddDialog] = useState(null); // { workItemName }
  const [addMaterialId, setAddMaterialId] = useState("");
  const [addQty, setAddQty] = useState(1);
  const [addNotes, setAddNotes] = useState("");
  const [poBusy, setPoBusy] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  // { title, description, confirmLabel, destructive?, onConfirm }
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  const isDraft = (plan?.status || "DRAFT") === "DRAFT";
  const canEdit = isDraft && !archived;
  const hasReservations = lines.some((l) => toQty(l.reservedQty) > 0);
  const displayProjectName = projectName || "Project";
  const selectableSelectedCount = useMemo(
    () =>
      lines.reduce((count, line, index) => {
        if (line.packageId) return count;
        return selectedLineKeys.has(line.uuid || line.clientKey || `idx-${index}`) ? count + 1 : count;
      }, 0),
    [lines, selectedLineKeys]
  );

  const materialById = useMemo(() => {
    const map = new Map();
    materials.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [materials]);

  const snapshotFromParts = (status, nextLines, nextPackages) =>
    JSON.stringify({
      status: status || "DRAFT",
      lines: (nextLines || []).map((l, idx) => {
        const plannedQty = l.plannedQty === "" || l.plannedQty == null ? 0 : l.plannedQty;
        const stockQtySnapshot = l.stockQtySnapshot ?? 0;
        return {
          materialId: l.materialId ?? null,
          materialName: l.materialName || "",
          workItemNames: workItemLabels(l),
          plannedQty,
          stockQtySnapshot,
          unit: l.unit || "",
          shortageFlag: materialLineShortage(plannedQty, stockQtySnapshot),
          reservedQty: l.reservedQty ?? 0,
          notes: l.notes || "",
          substituteReason: l.substituteReason || "",
          sortOrder: l.sortOrder ?? idx,
          packageId: l.packageId || null,
        };
      }),
      packages: (nextPackages || []).map((p, idx) => ({
        id: p.id,
        name: p.name,
        sortOrder: p.sortOrder ?? idx,
      })),
    });

  const currentSnapshot = useMemo(
    () => snapshotFromParts(plan?.status, lines, packages),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan?.status, lines, packages]
  );
  const isDirty = savedSnapshot != null && currentSnapshot !== savedSnapshot;
  const navigate = useNavigate();
  const [leaveTarget, setLeaveTarget] = useState(null);

  useEffect(() => {
    if (!isDirty) return undefined;
    const onClick = (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target?.closest?.("a[href]");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTarget(next);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const applyPlanData = (data, { markClean = false } = {}) => {
    const nextLines = Array.isArray(data?.lines) ? data.lines.map((l) => ({ ...l })) : [];
    const nextPackages = Array.isArray(data?.packages)
      ? data.packages.map((p) => ({
          id: p.id,
          name: p.name,
          sortOrder: p.sortOrder ?? 0,
        }))
      : [];
    setPlan(data);
    setLines(nextLines);
    setPackages(nextPackages);
    if (markClean) {
      setSavedSnapshot(snapshotFromParts(data?.status, nextLines, nextPackages));
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchMaterialPlan(projectId),
      fetchMaterials({ active: true }, 0, 500).catch(() => ({ content: [] })),
      fetchProjectById(projectId).catch(() => null),
    ])
      .then(([data, matRes, project]) => {
        applyPlanData(data, { markClean: true });
        const list = matRes?.content ?? (Array.isArray(matRes) ? matRes : []);
        setMaterials(list);
        setProjectName(project?.projectName || project?.name || "");
        rememberProjectName(projectId, project?.projectName || project?.name);
      })
      .catch(() => {
        setPlan(null);
        setLines([]);
        setPackages([]);
        setSavedSnapshot(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    if (archived) {
      notify.warning("Archived", { description: "This project is archived and read-only." });
      return;
    }
    setBusy(true);
    try {
      const data = await fn();
      if (data?.lines || data?.packages) {
        applyPlanData(data, { markClean: true });
      } else if (data) {
        setPlan(data);
        setSavedSnapshot(snapshotFromParts(data?.status, lines, packages));
      } else {
        await load();
      }
      if (okMsg) notify.success(okMsg);
    } catch (e) {
      const errMsg = e?.response?.data?.error || e?.response?.data?.message || "Request failed";
      notify.error(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const patchLine = (index, patch) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if ("plannedQty" in patch || "stockQtySnapshot" in patch) {
          next.shortageFlag = materialLineShortage(next.plannedQty, next.stockQtySnapshot);
        }
        return next;
      })
    );
  };

  const askConfirm = ({ title, description, confirmLabel = "Confirm", destructive = false, onConfirm }) => {
    setConfirmDialog({ title, description, confirmLabel, destructive, onConfirm });
  };

  const closeConfirm = () => setConfirmDialog(null);

  const handleConfirmAction = () => {
    const action = confirmDialog?.onConfirm;
    closeConfirm();
    action?.();
  };

  const deleteLine = (index) => {
    askConfirm({
      title: "Remove material line?",
      description: "This material will be removed from the plan. Save the plan to persist the change.",
      confirmLabel: "Remove",
      destructive: true,
      onConfirm: () => {
        setLines((prev) => prev.filter((_, i) => i !== index));
        setSelectedLineKeys(new Set());
      },
    });
  };

  const lineKey = (line, index) => line.uuid || line.clientKey || `idx-${index}`;

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
        packageId: l.packageId || null,
      };
    });

  const packagePayload = () =>
    packages.map((p, idx) => ({
      id: p.id,
      name: p.name,
      sortOrder: p.sortOrder ?? idx,
    }));

  const handleGenerate = () => {
    const description =
      packages.length > 0
        ? "Regenerating from BOQ will wipe all material lines and packages. This cannot be undone from this screen."
        : "Regenerating from BOQ will replace all material lines. This cannot be undone from this screen.";
    askConfirm({
      title: "Generate from BOQ?",
      description,
      confirmLabel: "Continue",
      destructive: true,
      onConfirm: () => {
        run(async () => {
          const data = await generateMaterialPlan(projectId);
          const count = Array.isArray(data?.lines) ? data.lines.length : 0;
          const sectionCount = Array.isArray(data?.sections) ? data.sections.length : 0;
          const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
          if (sectionCount > 0 && count > 0) {
            notify.success("Generated from BOQ", {
              description: `Generated ${count} material line${count === 1 ? "" : "s"} across ${sectionCount} work item${sectionCount === 1 ? "" : "s"}.`,
            });
          } else if (sectionCount > 0) {
            notify.warning("Generated from BOQ", {
              description:
                warnings.length > 0
                  ? `Loaded ${sectionCount} work item${sectionCount === 1 ? "" : "s"} from BOQ. ${warnings[0]}`
                  : `Loaded ${sectionCount} work item${sectionCount === 1 ? "" : "s"} from BOQ.`,
            });
          } else if (warnings.length > 0) {
            notify.warning("Generate from BOQ", { description: warnings.join(" ") });
          } else {
            notify.warning("Generate from BOQ", {
              description:
                "No material lines could be generated. Ensure the project has an approved BOQ with work items that have materials configured.",
            });
          }
          setSelectedLineKeys(new Set());
          return data;
        }, null);
      },
    });
  };

  const handleSave = () =>
    run(async () => {
      const data = await updateMaterialPlan(projectId, {
        status: plan?.status || "DRAFT",
        lines: linePayload(),
        packages: packagePayload(),
      });
      const saved = Array.isArray(data?.lines) ? data.lines : [];
      const shortageCount = saved.filter((l) => l.shortageFlag).length;
      notify.success("Plan saved", {
        description:
          shortageCount > 0
            ? `${shortageCount} line${shortageCount === 1 ? "" : "s"} flagged as shortage.`
            : "All lines are covered by current stock.",
      });
      return data;
    }, null);

  const handleReady = () =>
    run(
      () =>
        updateMaterialPlan(projectId, {
          status: "READY",
          lines: linePayload(),
          packages: packagePayload(),
        }),
      "Marked READY"
    );

  const handleEditDraft = () =>
    run(async () => {
      if (hasReservations) {
        await unreserveMaterialPlan(projectId);
      }
      return updateMaterialPlan(projectId, {
        status: "DRAFT",
        lines: linePayload().map((l) => ({ ...l, reservedQty: 0 })),
        packages: packagePayload(),
      });
    }, "Switched to Draft — reservations released");

  const handleReserve = () =>
    run(async () => {
      const data = await reserveMaterialPlan(projectId);
      const reservedLines = Array.isArray(data?.lines) ? data.lines : lines;
      const totalReserved = reservedLines.reduce((sum, l) => sum + (Number(l.reservedQty) || 0), 0);
      const softHeld = reservedLines.filter((l) => Number(l.reservedQty) > 0).length;
      notify.success("Stock soft-held", {
        description: `${softHeld} line(s) reserved · ${totalReserved} total qty soft-held on stock`,
      });
      return data;
    }, null);

  const handleUnreserve = () =>
    run(async () => {
      const data = await unreserveMaterialPlan(projectId);
      notify.success("Reservations released", {
        description: "Soft holds for this plan were cleared from stock.",
      });
      return data;
    }, null);

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

  const createPackage = () => {
    const name = newPackageName.trim();
    if (!name) return;
    const id = newClientId("pkg");
    setPackages((prev) => [...prev, { id, name, sortOrder: prev.length }]);
    setNewPackageName("");
  };

  const deletePackage = (pkgId) => {
    askConfirm({
      title: "Delete package?",
      description: "Lines in this package will become unassigned. Save the plan to persist the change.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        setPackages((prev) => prev.filter((p) => p.id !== pkgId));
        setLines((prev) =>
          prev.map((l) => (String(l.packageId) === String(pkgId) ? { ...l, packageId: null } : l))
        );
      },
    });
  };

  const toggleSelectLine = (key, checked, line) => {
    if (line?.packageId) {
      const pkgName =
        packages.find((p) => String(p.id) === String(line.packageId))?.name || "a package";
      askConfirm({
        title: "Already assigned",
        description: `This material is already assigned to “${pkgName}”. Unassign it from the line’s package dropdown before selecting it here.`,
        confirmLabel: "OK",
        destructive: false,
        onConfirm: () => {},
      });
      return;
    }
    setSelectedLineKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const assignSelectedToPackage = () => {
    if (!assignPackageId || selectedLineKeys.size === 0) return;
    setLines((prev) =>
      prev.map((l, idx) => {
        const key = lineKey(l, idx);
        if (!selectedLineKeys.has(key) || l.packageId) return l;
        return { ...l, packageId: assignPackageId };
      })
    );
    setSelectedLineKeys(new Set());
  };

  const openAddMaterial = (workItemName) => {
    setAddDialog({ workItemName });
    setAddMaterialId("");
    setAddQty(1);
    setAddNotes("");
  };

  const confirmAddMaterial = () => {
    const mat = materials.find((m) => String(m.id) === addMaterialId);
    if (!mat) return;
    const qty = toQty(addQty);
    const stock = mat.quantityOnHand ?? 0;
    setLines((prev) => [
      ...prev,
      {
        clientKey: newClientId("line"),
        materialId: mat.id,
        materialName: mat.materialName,
        workItemNames: addDialog?.workItemName ? [addDialog.workItemName] : [],
        plannedQty: qty,
        stockQtySnapshot: stock,
        unit: mat.unitType || "",
        shortageFlag: materialLineShortage(qty, stock),
        reservedQty: 0,
        notes: addNotes,
        substituteReason: "",
        packageId: null,
        sortOrder: prev.length,
      },
    ]);
    setAddDialog(null);
  };

  const wholePoLines = useMemo(() => enrichPoLines(lines, materialById), [lines, materialById]);
  const wholePoNumber = buildPoNumber(projectId, "ALL");
  const wholeSupplier = dominantSupplier(wholePoLines);

  const packagePoData = useMemo(
    () =>
      packages.map((pkg) => {
        const pkgLines = lines.filter((l) => String(l.packageId) === String(pkg.id));
        const enriched = enrichPoLines(pkgLines, materialById);
        return {
          pkg,
          elementId: `material-po-pkg-${pkg.id}`,
          poNumber: buildPoNumber(projectId, pkg.name || pkg.id),
          lines: enriched,
          supplier: dominantSupplier(enriched),
        };
      }),
    [packages, lines, materialById, projectId]
  );

  const runPo = async (fn) => {
    setPoBusy(true);
    try {
      await fn();
    } catch (e) {
      notify.error("PDF export failed", { description: e?.message || "Request failed" });
    } finally {
      setPoBusy(false);
    }
  };

  if (loading) {
    if (inHub) {
      return <PlanningHubSkeleton />;
    }
    return (
      <PageShell>
        <PlanningHubSkeleton />
      </PageShell>
    );
  }

  const groupedLines = buildDisplaySections(plan, lines);
  const hasWorkItemSections = groupedLines.length > 0;
  const Shell = inHub ? "div" : PageShell;
  const Frame = inHub ? "div" : ProjectPageFrame;
  const frameClass = inHub ? "space-y-6" : undefined;

  return (
    <Shell>
      <Frame className={frameClass}>
      {!inHub && (
        <>
          <ProjectPathLine
            projectId={projectId}
            initialName={projectName}
            backTo={backPath}
            backTitle={`Back to ${backLabel}`}
          />
          <PageHeader
            title="Material Plan"
            subtitle={displayProjectName}
            actions={plan?.status ? (
              <Badge
                className={cn(
                  "rounded-full border-none px-2.5 py-0.5 text-xs font-medium",
                  isDraft
                    ? "bg-sky-500/15 text-sky-800"
                    : "bg-[#C9A96E]/20 text-[#8a6d3b]"
                )}
              >
                {isDraft ? "In Progress" : "Ready"}
              </Badge>
            ) : null}
          />
        </>
      )}
      {inHub && plan?.status ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Material plan</p>
          <Badge
            className={cn(
              "rounded-full border-none px-2.5 py-0.5 text-xs font-medium",
              isDraft
                ? "bg-sky-500/15 text-sky-800"
                : "bg-[#C9A96E]/20 text-[#8a6d3b]"
            )}
          >
            {isDraft ? "In Progress" : "Ready"}
          </Badge>
        </div>
      ) : null}

      <ProjectLifecycleBanner commercialStage={commercialStage} />

      <div className="flex flex-wrap items-center gap-2">
        {/* Primary trigger — always visible */}
        <Button
          size="sm"
          className="min-h-11 md:min-h-9"
          onClick={handleGenerate}
          disabled={busy || archived}
        >
          <RefreshCw className="mr-1 h-4 w-4" /> Generate from BOQ
        </Button>

        {/* Plan operations — desktop */}
        <div className="hidden flex-wrap gap-2 md:flex">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={busy || archived || !canEdit}
          >
            <Save className="mr-1 h-4 w-4" /> Save plan
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReserve}
            disabled={busy || archived || !plan}
          >
            <Package className="mr-1 h-4 w-4" /> Reserve stock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnreserve}
            disabled={busy || archived || !plan || !hasReservations}
          >
            <Unlock className="mr-1 h-4 w-4" /> Unreserve
          </Button>
        </div>

        {/* Export / View — desktop */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={busy || !plan}>
                <FileText className="mr-1 h-4 w-4" />
                Export / View
                <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleExport} disabled={busy || !plan}>
                <Download className="h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={poBusy || lines.length === 0}
                onClick={() => runPo(() => previewMaterialPoPdf("material-po-print-all"))}
              >
                <Eye className="h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={poBusy || lines.length === 0}
                onClick={() =>
                  runPo(() =>
                    downloadMaterialPoPdf("material-po-print-all", `${wholePoNumber}.pdf`)
                  )
                }
              >
                <Download className="h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile: collapse secondary actions */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 w-11 px-0"
                aria-label="More plan actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem
                onClick={handleSave}
                disabled={busy || archived || !canEdit}
              >
                <Save className="h-4 w-4" /> Save plan
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReserve}
                disabled={busy || archived || !plan}
              >
                <Package className="h-4 w-4" /> Reserve stock
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleUnreserve}
                disabled={busy || archived || !plan || !hasReservations}
              >
                <Unlock className="h-4 w-4" /> Unreserve
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport} disabled={busy || !plan}>
                <Download className="h-4 w-4" /> CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={poBusy || lines.length === 0}
                onClick={() => runPo(() => previewMaterialPoPdf("material-po-print-all"))}
              >
                <Eye className="h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={poBusy || lines.length === 0}
                onClick={() =>
                  runPo(() =>
                    downloadMaterialPoPdf("material-po-print-all", `${wholePoNumber}.pdf`)
                  )
                }
              >
                <Download className="h-4 w-4" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Final milestone */}
        <div className="ml-auto flex flex-wrap gap-2">
          {isDraft ? (
            <Button
              size="sm"
              className="min-h-11 border-0 bg-[#C9A96E] text-[#0a1628] hover:bg-[#b8955a] hover:text-[#0a1628] md:min-h-9"
              onClick={handleReady}
              disabled={busy || archived || !plan}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark READY
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="min-h-11 md:min-h-9"
              onClick={handleEditDraft}
              disabled={busy || archived}
            >
              <Pencil className="mr-1 h-4 w-4" /> Edit (reopen)
            </Button>
          )}
        </div>
      </div>

      {/* Packages */}
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 text-left"
            onClick={() => setPackagesOpen((o) => !o)}
          >
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">
                Packages{packages.length > 0 ? ` (${packages.length})` : ""}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Group plan materials into packages. Each line belongs to at most one package. Purchase orders can be
                previewed/downloaded per package or for the whole plan.
              </p>
            </div>
            {packagesOpen ? (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {packagesOpen && (
        <CardContent className="space-y-4">
          {canEdit && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="w-full space-y-1 sm:w-auto">
                <p className="text-[10px] uppercase text-muted-foreground">New package</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="h-9 w-full rounded-md text-xs sm:w-48"
                    placeholder="Package name"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                    onClick={createPackage}
                    disabled={!newPackageName.trim()}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Create
                  </Button>
                </div>
              </div>
              <div className="w-full space-y-1 sm:w-auto">
                <p className="text-[10px] uppercase text-muted-foreground">
                  Assign selected ({selectableSelectedCount})
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={assignPackageId} onValueChange={setAssignPackageId}>
                    <SelectTrigger className="h-9 w-full rounded-md text-xs sm:w-48">
                      <SelectValue placeholder="Choose package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                          {pkg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-h-11 w-full sm:min-h-9 sm:w-auto"
                    onClick={assignSelectedToPackage}
                    disabled={!assignPackageId || selectableSelectedCount === 0}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          )}

          {packages.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No packages yet. Whole-plan PO is available from the toolbar Export / View menu.
            </p>
          ) : (
            <div className="space-y-2">
              {packages.map((pkg) => {
                const pkgLines = lines.filter((l) => String(l.packageId) === String(pkg.id));
                const count = pkgLines.length;
                const po = packagePoData.find((p) => p.pkg.id === pkg.id);
                const expanded = expandedPackageIds.has(String(pkg.id));
                return (
                  <div
                    key={pkg.id}
                    className="overflow-hidden rounded-lg border border-border bg-background/60"
                  >
                    <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        className="flex min-w-0 items-start gap-2 text-left"
                        onClick={() =>
                          setExpandedPackageIds((prev) => {
                            const next = new Set(prev);
                            const id = String(pkg.id);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            return next;
                          })
                        }
                      >
                        {expanded ? (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {count} material line{count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </button>
                      <div className="flex flex-wrap gap-2 sm:pl-6">
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-11 md:min-h-9"
                          disabled={poBusy || count === 0}
                          onClick={() => runPo(() => previewMaterialPoPdf(po.elementId))}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-11 md:min-h-9"
                          disabled={poBusy || count === 0}
                          onClick={() =>
                            runPo(() => downloadMaterialPoPdf(po.elementId, `${po.poNumber}.pdf`))
                          }
                        >
                          <Download className="mr-1 h-3.5 w-3.5" /> PDF
                        </Button>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-11 text-destructive md:min-h-9"
                            onClick={() => deletePackage(pkg.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {expanded && (
                      <div className="border-t border-border bg-muted/50 px-3 py-2">
                        {count === 0 ? (
                          <p className="py-1 text-xs text-muted-foreground">No materials in this package yet.</p>
                        ) : (
                          <ul className="space-y-1">
                            {pkgLines.map((line, idx) => (
                              <li
                                key={line.uuid || line.clientKey || `${pkg.id}-${idx}`}
                                className="flex items-center justify-between gap-2 py-0.5 text-xs"
                              >
                                <span className="truncate font-medium">{line.materialName}</span>
                                <span className="shrink-0 tabular-nums text-muted-foreground">
                                  {line.plannedQty ?? 0} {line.unit || ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canEdit && lines.length > 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium">Multi-select plan materials</p>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Only unassigned materials can be selected. Assigned items stay checked and locked.
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {lines.map((line, index) => {
                  const key = lineKey(line, index);
                  const assigned = Boolean(line.packageId);
                  const pkgName = packages.find((p) => String(p.id) === String(line.packageId))?.name;
                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      className={`flex min-h-11 items-center gap-2 py-1 text-xs md:min-h-0 md:py-0.5 ${
                        assigned ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                      }`}
                      onClick={() => {
                        if (assigned) {
                          toggleSelectLine(key, true, line);
                          return;
                        }
                        toggleSelectLine(key, !selectedLineKeys.has(key), line);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        if (assigned) {
                          toggleSelectLine(key, true, line);
                          return;
                        }
                        toggleSelectLine(key, !selectedLineKeys.has(key), line);
                      }}
                    >
                      <Checkbox
                        checked={assigned || selectedLineKeys.has(key)}
                        disabled={assigned}
                        onCheckedChange={(c) => {
                          if (assigned) {
                            toggleSelectLine(key, true, line);
                            return;
                          }
                          toggleSelectLine(key, !!c, line);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="min-w-0 flex-1 truncate">{line.materialName}</span>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        {pkgName || "Unassigned"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Work items */}
      <Card className="rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setWorkItemsOpen((o) => !o)}
          >
            <CardTitle className="text-sm font-semibold">
              {hasWorkItemSections
                ? `Work items (${groupedLines.length}) · ${lines.length} material line${lines.length === 1 ? "" : "s"}`
                : `Plan lines (${lines.length})`}
            </CardTitle>
            {workItemsOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {workItemsOpen && (
          <CardContent>
            {!hasWorkItemSections ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
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
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <AccordionTrigger className="bg-muted/50 px-4 py-3 hover:bg-muted hover:no-underline data-[state=open]:border-b data-[state=open]:border-border [&>svg]:text-muted-foreground">
                      <div className="min-w-0 flex-1 pr-3 text-left">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Work item
                        </p>
                        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                          {group.workItemName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {group.isEmpty
                            ? "No materials configured"
                            : `${group.materialCount} material${group.materialCount === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-background/40 px-4 pb-3">
                      {group.isEmpty && !canEdit ? (
                        <p className="py-4 text-sm text-muted-foreground">
                          No materials are configured for this work item in Project Configuration.
                        </p>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <div className="divide-y divide-border/40">
                              {group.entries
                                .filter((e) => e.index >= 0)
                                .map(({ line, index }) => (
                                  <MaterialPlanLineRow
                                    key={line.uuid || line.clientKey || `${group.key}-${index}`}
                                    line={line}
                                    index={index}
                                    onPatch={patchLine}
                                    onDelete={deleteLine}
                                    packages={packages}
                                    materials={materials}
                                    readOnly={!canEdit || index < 0}
                                  />
                                ))}
                            </div>
                          </div>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 min-h-11 md:min-h-9"
                              onClick={() => openAddMaterial(group.workItemName)}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Add material
                            </Button>
                          )}
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        )}
      </Card>

      {/* Hidden PO templates for PDF capture — keep fully off-screen / invisible */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "794px",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        <PurchaseOrderTemplate
          elementId="material-po-print-all"
          projectId={projectId}
          projectName={displayProjectName}
          packageName={null}
          poNumber={wholePoNumber}
          poDate={new Date().toISOString()}
          supplierName={wholeSupplier}
          lines={wholePoLines}
        />
        {packagePoData.map((po) => (
          <PurchaseOrderTemplate
            key={po.elementId}
            elementId={po.elementId}
            projectId={projectId}
            projectName={displayProjectName}
            packageName={po.pkg.name}
            poNumber={po.poNumber}
            poDate={new Date().toISOString()}
            supplierName={po.supplier}
            lines={po.lines}
          />
        ))}
      </div>

      <Dialog open={!!addDialog} onOpenChange={(open) => !open && setAddDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add material</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Work item: <span className="font-medium text-foreground">{addDialog?.workItemName}</span>
          </p>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground">Material master</p>
              <Select value={addMaterialId} onValueChange={setAddMaterialId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.materialName}
                      {m.materialCode ? ` (${m.materialCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground">Quantity</p>
              <Input
                type="number"
                className="h-9"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground">Notes</p>
              <Input className="h-9" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddDialog(null)}>Cancel</Button>
            <Button onClick={confirmAddMaterial} disabled={!addMaterialId || toQty(addQty) <= 0}>
              Add to plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog?.destructive ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              {confirmDialog?.confirmLabel || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveTarget != null}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLeaveTarget(null)}>
              Stay
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = leaveTarget;
                setLeaveTarget(null);
                if (target) navigate(target);
              }}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Frame>
    </Shell>
  );
}
