import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOQ_CATEGORIES, CUSTOM_CATEGORY_VALUE } from "./boqDataUtils";
import { formatCurrency } from "./quantityCalcUtils";

const UNIT_OPTIONS = [
  { value: "lot", label: "Lot" },
  { value: "nos", label: "Nos" },
  { value: "sqm", label: "sqm" },
  { value: "sqft", label: "sqft" },
  { value: "m", label: "m" },
  { value: "set", label: "Set" },
  { value: "ps", label: "PS" },
];

const EMPTY_FORM = {
  categoryCode: "B",
  customCategoryName: "",
  customCategoryCode: "",
  description: "",
  qty: "1",
  unit: "lot",
  rate: "",
  remarks: "",
};

function canAddLine(form) {
  const rate = parseFloat(form.rate) || 0;
  const isCustom = form.categoryCode === CUSTOM_CATEGORY_VALUE;
  if (isCustom) {
    return form.customCategoryName.trim().length > 0 && rate > 0;
  }
  return rate > 0;
}

export default function BoqChargesEditor({
  lines = [],
  onAdd,
  onUpdate,
  onRemove,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isCustomCategory = form.categoryCode === CUSTOM_CATEGORY_VALUE;

  const handleAdd = () => {
    if (!canAddLine(form)) return;

    const isCustom = form.categoryCode === CUSTOM_CATEGORY_VALUE;
    onAdd({
      categoryCode: isCustom ? CUSTOM_CATEGORY_VALUE : form.categoryCode,
      customCategoryName: isCustom ? form.customCategoryName.trim() : undefined,
      customCategoryCode: isCustom ? form.customCategoryCode.trim() : undefined,
      isCustomCategory: isCustom,
      description: form.description.trim(),
      qty: parseFloat(form.qty) || 1,
      unit: form.unit,
      unitShort: form.unit,
      rate: parseFloat(form.rate) || 0,
      remarks: form.remarks.trim(),
    });
    setForm(EMPTY_FORM);
  };

  return (
    <Card className="print:hidden border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Additional Charges &amp; Services</CardTitle>
        <p className="text-xs text-muted-foreground">
          Add preliminaries, approvals, optional works, and other BOQ items not captured in the site survey (JCT Summary categories).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select
              value={form.categoryCode}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  categoryCode: v,
                  customCategoryName: v === CUSTOM_CATEGORY_VALUE ? f.customCategoryName : "",
                  customCategoryCode: v === CUSTOM_CATEGORY_VALUE ? f.customCategoryCode : "",
                }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOQ_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code} className="text-xs">
                    {cat.code} — {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_CATEGORY_VALUE} className="text-xs font-medium">
                  + Custom category…
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomCategory && (
            <>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs">Custom name *</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="e.g. Logistics"
                  value={form.customCategoryName}
                  onChange={(e) => setForm((f) => ({ ...f, customCategoryName: e.target.value }))}
                />
              </div>
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-xs">Code</Label>
                <Input
                  className="h-9 text-xs"
                  placeholder="LOG"
                  value={form.customCategoryCode}
                  onChange={(e) => setForm((f) => ({ ...f, customCategoryCode: e.target.value.toUpperCase() }))}
                />
              </div>
            </>
          )}

          <div className={`space-y-1.5 ${isCustomCategory ? "md:col-span-4" : "md:col-span-5"}`}>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              rows={2}
              className="text-xs min-h-[36px]"
              placeholder="e.g. Site mobilization and protection"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <Label className="text-xs">Qty</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-9 text-xs"
              value={form.qty}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            />
          </div>
          <div className="md:col-span-1 space-y-1.5">
            <Label className="text-xs">Unit</Label>
            <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u.value} value={u.value} className="text-xs">
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-xs">Rate (AED) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="h-9 text-xs"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
          </div>
        </div>

        <Button type="button" size="sm" onClick={handleAdd} disabled={!canAddLine(form)}>
          <Plus className="h-4 w-4 mr-1" /> Add to BOQ
        </Button>

        {lines.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Category</th>
                  <th className="text-left px-3 py-2 font-semibold">Description</th>
                  <th className="text-right px-3 py-2 font-semibold">Qty</th>
                  <th className="text-right px-3 py-2 font-semibold">Rate</th>
                  <th className="text-right px-3 py-2 font-semibold">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      {line.isCustomCategory ? (
                        <div className="space-y-1">
                          <Input
                            className="h-7 w-14 text-xs font-mono"
                            value={line.categoryCode}
                            onChange={(e) =>
                              onUpdate(line.id, {
                                categoryCode: e.target.value.toUpperCase(),
                                isCustomCategory: true,
                              })
                            }
                          />
                          <Input
                            className="h-7 text-xs"
                            value={line.categoryName}
                            onChange={(e) =>
                              onUpdate(line.id, {
                                categoryName: e.target.value,
                                parent: e.target.value,
                                isCustomCategory: true,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <span className="font-mono font-semibold">{line.categoryCode}</span>
                          <span className="block text-[10px] text-muted-foreground">{line.categoryName}</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Input
                        className="h-8 text-xs mb-1"
                        placeholder="Optional"
                        value={line.description}
                        onChange={(e) => onUpdate(line.id, { description: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-7 w-16 text-xs"
                          value={line.qty}
                          onChange={(e) => onUpdate(line.id, { qty: e.target.value })}
                        />
                        <Input
                          className="h-7 w-16 text-xs"
                          value={line.unitShort || line.unit}
                          onChange={(e) =>
                            onUpdate(line.id, { unit: e.target.value, unitShort: e.target.value })
                          }
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-7 w-24 text-xs"
                          value={line.rate}
                          onChange={(e) => onUpdate(line.id, { rate: e.target.value })}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums align-top">{line.qty}</td>
                    <td className="px-3 py-2 text-right tabular-nums align-top">{formatCurrency(line.rate)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums align-top">
                      {formatCurrency(line.amount)}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onRemove(line.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
