import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Optional materials-used rows for a progress update.
 * `planLines` = material plan lines [{ uuid, materialId, materialName, plannedQty, unit }]
 * `rows` = [{ materialId, planLineUuid, qty }]
 */
export default function ProgressMaterialIssuesFields({ planLines = [], rows = [], onChange }) {
  const lines = Array.isArray(planLines) ? planLines.filter((l) => l?.materialId) : [];

  const updateRow = (index, patch) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange?.(next);
  };

  const addRow = () => {
    const first = lines[0];
    onChange?.([
      ...rows,
      {
        materialId: first?.materialId || "",
        planLineUuid: first?.uuid || null,
        qty: "",
      },
    ]);
  };

  const removeRow = (index) => {
    onChange?.(rows.filter((_, i) => i !== index));
  };

  const onMaterialChange = (index, materialId) => {
    const line = lines.find((l) => String(l.materialId) === String(materialId));
    updateRow(index, {
      materialId,
      planLineUuid: line?.uuid || null,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Materials used (optional)</Label>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addRow} disabled={lines.length === 0}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      {lines.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          No material plan lines for this project yet. Progress can still be submitted without materials.
        </p>
      )}
      {rows.map((row, index) => {
        const line = lines.find((l) => String(l.materialId) === String(row.materialId));
        return (
          <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-border/50 p-2">
            <div className="min-w-[10rem] flex-1">
              <Label className="text-[10px] text-muted-foreground">Material</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                value={row.materialId || ""}
                onChange={(e) => onMaterialChange(index, e.target.value)}
              >
                <option value="">Select material</option>
                {lines.map((l) => (
                  <option key={l.materialId} value={l.materialId}>
                    {l.materialName || l.materialId}
                    {l.plannedQty != null ? ` (plan ${l.plannedQty}${l.unit ? ` ${l.unit}` : ""})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <Label className="text-[10px] text-muted-foreground">Qty used</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="h-8 text-xs"
                value={row.qty}
                onChange={(e) => updateRow(index, { qty: e.target.value })}
              />
            </div>
            {line?.plannedQty != null && (
              <p className="pb-2 text-[10px] text-muted-foreground whitespace-nowrap">
                Planned {line.plannedQty}{line.unit ? ` ${line.unit}` : ""}
              </p>
            )}
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeRow(index)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/** Build API payload from UI rows; drops empty/invalid rows. */
export function toMaterialIssuesPayload(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r?.materialId && r.qty !== "" && r.qty != null && Number(r.qty) > 0)
    .map((r) => ({
      materialId: r.materialId,
      qty: Number(r.qty),
      ...(r.planLineUuid ? { planLineUuid: r.planLineUuid } : {}),
    }));
}
