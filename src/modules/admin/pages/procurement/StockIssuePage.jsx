import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMaterials } from "../../api/material.api";
import { fetchAllProjects } from "../../api/projects.api";
import { recordStockIssue } from "../../api/stock.api";

export default function StockIssuePage() {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    materialId: "",
    quantity: "",
    projectId: "",
    referenceNo: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetchMaterials({ active: true }, 0, 200),
      fetchAllProjects(),
    ]).then(([matRes, projRes]) => {
      setMaterials(matRes?.content ?? (Array.isArray(matRes) ? matRes : []));
      setProjects(Array.isArray(projRes) ? projRes : []);
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
      await recordStockIssue({
        materialId: form.materialId,
        quantity: parseFloat(form.quantity),
        projectId: form.projectId ? Number(form.projectId) : null,
        referenceNo: form.referenceNo.trim() || null,
        notes: form.notes.trim() || null,
      });
      setToast({ type: "success", message: "Stock issue recorded successfully." });
      setForm({ materialId: "", quantity: "", projectId: "", referenceNo: "", notes: "" });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ConfigurationLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.message}
        </div>
      )}
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Stock Issue" description="Issue materials from warehouse to a project or site." />
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Material *</Label>
                <Select value={form.materialId} onValueChange={(v) => setForm((p) => ({ ...p, materialId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.materialName} — Stock: {m.quantityOnHand ?? 0}
                      </SelectItem>
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
                  <Label>Project (optional)</Label>
                  <Select value={form.projectId || "none"} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.projectName || p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={form.referenceNo} onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Issue validates sufficient stock before decreasing quantity on hand.
              </div>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Record Issue"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ConfigurationLayout>
  );
}
