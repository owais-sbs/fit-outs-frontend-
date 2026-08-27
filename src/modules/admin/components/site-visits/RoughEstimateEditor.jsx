import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { computeLineAmount, computeSubtotal } from "../../api/site-visit-estimate.api";
import { formatEstimateAmount } from "../../data/jctCoverLetterCopy";
import { countScopedItems, normalizeRoomScopes } from "../../data/renovationChecklist";

function emptyLine() {
  return {
    floorName: "",
    roomName: "",
    category: "",
    description: "",
    qty: 1,
    unit: "LS",
    rate: 0,
    amount: 0,
    displayOrder: 0,
  };
}

export default function RoughEstimateEditor({
  estimate,
  roomScopes = [],
  onChange,
  disabled = false,
}) {
  const lines = Array.isArray(estimate?.lines) ? estimate.lines : [];
  const floors = normalizeRoomScopes(roomScopes);
  const scopedItemCount = countScopedItems(floors);
  const subtotal = computeSubtotal(lines);

  const updateField = (field, value) => {
    if (disabled) return;
    onChange?.({ ...estimate, [field]: value });
  };

  const updateLine = (index, patch) => {
    if (disabled) return;
    const nextLines = lines.map((line, i) => {
      if (i !== index) return line;
      const merged = { ...line, ...patch };
      merged.amount = computeLineAmount(merged.qty, merged.rate);
      return merged;
    });
    onChange?.({
      ...estimate,
      lines: nextLines,
      subtotal: computeSubtotal(nextLines),
    });
  };

  const addLine = () => {
    if (disabled) return;
    const nextLines = [...lines, { ...emptyLine(), displayOrder: lines.length }];
    onChange?.({
      ...estimate,
      lines: nextLines,
      subtotal: computeSubtotal(nextLines),
    });
  };

  const removeLine = (index) => {
    if (disabled) return;
    const nextLines = lines.filter((_, i) => i !== index);
    onChange?.({
      ...estimate,
      lines: nextLines,
      subtotal: computeSubtotal(nextLines),
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.85fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Rough estimate lines</h2>
            <p className="text-xs text-muted-foreground">
              Seeded from the visit checklist. Enter rates for a rough total — not a finalized BoQ.
            </p>
          </div>
          <Badge variant="secondary">{formatEstimateAmount(subtotal, estimate?.currency || "AED")}</Badge>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full min-w-[720px] text-sm">
            <thead className=" text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Floor / Room</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium w-20">Qty</th>
                <th className="px-3 py-2 font-medium w-20">Unit</th>
                <th className="px-3 py-2 font-medium w-28">Rate</th>
                <th className="px-3 py-2 font-medium w-28">Amount</th>
                <th className="px-2 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No lines yet. Add a line or ensure the visit has checklist items selected.
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr key={`${line.uuid || "new"}-${index}`} className="border-t border-border/50">
                    <td className="px-3 py-2 align-top">
                      <Input
                        value={line.floorName || ""}
                        disabled={disabled}
                        placeholder="Floor"
                        className="mb-1 h-8"
                        onChange={(e) => updateLine(index, { floorName: e.target.value })}
                      />
                      <Input
                        value={line.roomName || ""}
                        disabled={disabled}
                        placeholder="Room"
                        className="h-8"
                        onChange={(e) => updateLine(index, { roomName: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        value={line.category || ""}
                        disabled={disabled}
                        placeholder="Category"
                        className="h-8"
                        onChange={(e) => updateLine(index, { category: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        value={line.description || ""}
                        disabled={disabled}
                        placeholder="Item description"
                        className="h-8"
                        onChange={(e) => updateLine(index, { description: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.qty}
                        disabled={disabled}
                        className="h-8"
                        onChange={(e) => updateLine(index, { qty: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        value={line.unit || "LS"}
                        disabled={disabled}
                        className="h-8"
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rate}
                        disabled={disabled}
                        className="h-8"
                        onChange={(e) => updateLine(index, { rate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-sm font-medium pt-3">
                      {formatEstimateAmount(computeLineAmount(line.qty, line.rate), estimate?.currency || "AED")}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => removeLine(index)}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addLine}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add line
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Rough total (excl. VAT)</p>
            <p className="text-lg font-semibold">
              {formatEstimateAmount(subtotal, estimate?.currency || "AED")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Internal notes</Label>
          <Textarea
            value={estimate?.notes || ""}
            disabled={disabled}
            rows={3}
            placeholder="Optional notes for the surveyor / QS"
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Checklist reference</h3>
            <Badge variant="outline">{scopedItemCount} items</Badge>
          </div>
          {floors.length === 0 ? (
            <p className="text-xs text-muted-foreground">No room scope on this visit.</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {floors.map((floor) => (
                <div key={floor.floorName} className="rounded-md border border-border/50 bg-background p-2.5">
                  <p className="text-sm font-medium">{floor.floorName}</p>
                  <ul className="mt-1.5 space-y-1.5 text-xs text-muted-foreground">
                    {(floor.rooms || []).map((room) => (
                      <li key={`${floor.floorName}-${room.roomName}`}>
                        <span className="font-medium text-foreground">{room.roomName}</span>
                        {(room.selections || []).map((sel) => (
                          <div key={sel.category} className="ml-2 mt-0.5">
                            {sel.category}: {(sel.items || []).join(", ")}
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
