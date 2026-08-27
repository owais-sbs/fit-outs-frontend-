import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import { PageShell, PageTitle, Surface } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMaterials } from "../../api/material.api";
import { recordStockReceipt } from "../../api/stock.api";

export default function GoodsReceiptPage() {
  const [materials, setMaterials] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    materialId: "",
    quantity: "",
    unitCost: "",
    referenceNo: "",
    notes: "",
  });

  useEffect(() => {
    fetchMaterials({ active: true }, 0, 200).then((res) => {
      setMaterials(res?.content ?? (Array.isArray(res) ? res : []));
    }).catch(console.error);
  }, []);

  const selectedMaterial = materials.find((m) => m.id === form.materialId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.materialId || !form.quantity || parseFloat(form.quantity) <= 0) {
      setToast({ type: "error", message: "Material and positive quantity are required." });
      return;
    }
    setIsSaving(true);
    try {
      await recordStockReceipt({
        materialId: form.materialId,
        quantity: parseFloat(form.quantity),
        unitCost: form.unitCost ? parseFloat(form.unitCost) : null,
        referenceNo: form.referenceNo.trim() || null,
        notes: form.notes.trim() || null,
      });
      setToast({ type: "success", message: "Goods receipt recorded successfully." });
      setForm({ materialId: "", quantity: "", unitCost: "", referenceNo: "", notes: "" });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfigurationLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm ${
          toast.type === "success" ? "bg-emerald-50/90 text-emerald-800" : "bg-red-50/90 text-red-800"
        }`}>
          {toast.message}
        </div>
      )}
      <PageShell className="max-w-2xl">
        <PageTitle
          title="Goods Receipt"
          subtitle="Record incoming stock deliveries to the company warehouse."
        />
        <Surface className="p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Material *</Label>
              <Select value={form.materialId} onValueChange={(v) => {
                const mat = materials.find((m) => m.id === v);
                setForm((p) => ({
                  ...p,
                  materialId: v,
                  unitCost: mat?.costPrice?.toString() || p.unitCost,
                }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.materialName} ({m.materialCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity * {selectedMaterial ? `(${selectedMaterial.unitType})` : ""}</Label>
                <Input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Unit Cost (AED)</Label>
                <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Supplier / Delivery Reference</Label>
              <Input value={form.referenceNo} onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))} placeholder="PO number, invoice ref..." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Receipt increases quantity on hand and appends a RECEIPT movement to the ledger.
            </div>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Record Receipt"}</Button>
          </form>
        </Surface>
      </PageShell>
    </ConfigurationLayout>
  );
}
