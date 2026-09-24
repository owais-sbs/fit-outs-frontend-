import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchBoq, fetchBoqsByProject } from "@/modules/admin/api/boq.api";
import { formatCurrency } from "@/modules/admin/pages/boq/quantityCalcUtils";

const blankLine = (lineType = "LUMP_SUM") => ({
  lineType, description: "", unit: lineType === "LUMP_SUM" ? "ls" : "",
  quantity: 1, sellRate: 0, costRate: 0,
});

const boqLines = (docs) => (Array.isArray(docs) ? docs : [docs])
  .flatMap((doc) => doc?.lines || doc?.items || [])
  .filter(Boolean);

export default function VariationLinesEditor({ projectId, costMode, lines, onChange, disabled = false }) {
  const [boqs, setBoqs] = useState([]);
  const [picker, setPicker] = useState("");
  const [boqError, setBoqError] = useState("");

  useEffect(() => {
    if (!projectId || costMode === "LUMP_SUM") return;
    fetchBoqsByProject(projectId)
      .then(async (data) => {
        const list = Array.isArray(data) ? data : data ? [data] : [];
        const hydrated = await Promise.all(list.map((doc) =>
          (doc?.lines || doc?.items) ? doc : fetchBoq(doc.id || doc.uuid).catch(() => doc)
        ));
        setBoqs(hydrated);
      })
      .catch(() => setBoqError("BOQ lines could not be loaded"));
  }, [projectId, costMode]);

  const available = useMemo(() => boqLines(boqs), [boqs]);
  const update = (index, field, value) => onChange(lines.map((line, i) => (
    i === index ? { ...line, [field]: value } : line
  )));
  const addBoqLine = () => {
    const source = available.find((line) => String(line.id || line.uuid) === picker);
    if (!source) return;
    onChange([...lines, {
      lineType: "MODIFY",
      sourceBoqLineId: source.id || source.uuid,
      workItemId: source.workItemId || null,
      description: source.description || "",
      unit: source.unit || "",
      quantity: Number(source.quantity || 1),
      sellRate: Number(source.rate || source.sellRate || 0),
      costRate: Number(source.costRate || 0),
    }]);
    setPicker("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Pricing lines</Label>
        <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => onChange([...lines, blankLine(costMode === "BOQ_LINES" ? "NEW" : "LUMP_SUM")])}>
          <Plus className="mr-1 h-3 w-3" /> Add line
        </Button>
      </div>
      {costMode !== "LUMP_SUM" && (
        <div className="flex gap-2">
          <Select value={picker} onValueChange={setPicker} disabled={disabled}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Select an approved BOQ line" /></SelectTrigger>
            <SelectContent>
              {available.map((line) => (
                <SelectItem key={line.id || line.uuid} value={String(line.id || line.uuid)}>
                  {line.description} · {formatCurrency(line.amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" disabled={!picker || disabled} onClick={addBoqLine}>Add BOQ item</Button>
        </div>
      )}
      {boqError && <p className="text-xs text-destructive">{boqError}</p>}
      {lines.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No pricing lines added.</p>}
      {lines.map((line, index) => (
        <div key={line.uuid || index} className="grid gap-2 rounded-md border p-3 md:grid-cols-12">
          <div className="md:col-span-2">
            <Label className="text-xs">Type</Label>
            <Select value={line.lineType || "LUMP_SUM"} disabled={disabled} onValueChange={(v) => update(index, "lineType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LUMP_SUM">Lump sum</SelectItem>
                <SelectItem value="NEW">New item</SelectItem>
                <SelectItem value="MODIFY">Modify BOQ item</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4"><Label className="text-xs">Description</Label><Input disabled={disabled} value={line.description || ""} onChange={(e) => update(index, "description", e.target.value)} /></div>
          <div><Label className="text-xs">Unit</Label><Input disabled={disabled} value={line.unit || ""} onChange={(e) => update(index, "unit", e.target.value)} /></div>
          <div><Label className="text-xs">Qty</Label><Input disabled={disabled} type="number" value={line.quantity ?? ""} onChange={(e) => update(index, "quantity", e.target.value)} /></div>
          <div className="md:col-span-2"><Label className="text-xs">Sell rate</Label><Input disabled={disabled} type="number" value={line.sellRate ?? ""} onChange={(e) => update(index, "sellRate", e.target.value)} /></div>
          <div className="md:col-span-2 flex items-end gap-1"><div className="flex-1"><Label className="text-xs">Cost rate</Label><Input disabled={disabled} type="number" value={line.costRate ?? ""} onChange={(e) => update(index, "costRate", e.target.value)} /></div><Button type="button" size="icon" variant="ghost" disabled={disabled} onClick={() => onChange(lines.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>
        </div>
      ))}
    </div>
  );
}

export { blankLine };
