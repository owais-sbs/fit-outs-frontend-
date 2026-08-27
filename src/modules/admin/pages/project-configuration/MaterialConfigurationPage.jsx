import React, { useState, useEffect } from "react";
import {
  Search, Trash2, Edit2, Folder, X, AlertCircle, ChevronDown, ChevronRight, Package
} from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import MasterFormModal from "../../components/shared/configuration/MasterFormModal";
import DeleteConfirmationModal from "../../components/shared/configuration/DeleteConfirmationModal";
import EmptyState from "../../components/shared/configuration/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  fetchMaterials,
  fetchMaterialCategories,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createMaterialCategory,
  updateMaterialCategory,
} from "../../api/material.api";

const UNIT_TYPES = [
  { value: "SQFT", label: "Sq Ft" },
  { value: "SQM", label: "Sq Mtr" },
  { value: "RFT", label: "Running Ft" },
  { value: "RMT", label: "Running Meter" },
  { value: "PCS", label: "Nos" },
  { value: "SET", label: "Set" },
  { value: "LOT", label: "Lump Sum" },
  { value: "KG", label: "Kg" },
  { value: "BOX", label: "Box" },
  { value: "BAG", label: "Bag" },
];

const formatCurrency = (val) =>
  val != null && !Number.isNaN(Number(val))
    ? `AED ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

export default function MaterialConfigurationPage() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", code: "" });
  const [formData, setFormData] = useState({
    materialCategoryId: "",
    name: "",
    code: "",
    unit: "PCS",
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    sku: "",
    minStock: "",
    reorderQty: "",
    description: "",
  });

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCategories = async () => {
    try {
      const res = await fetchMaterialCategories();
      setCategories(Array.isArray(res) ? res : res?.content ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filter = {
        search: searchTerm.trim() || null,
        materialCategoryId: categoryFilter === "All" ? null : categoryFilter,
      };
      const res = await fetchMaterials(filter, 0, 200);
      const list = res?.content ?? (Array.isArray(res) ? res : []);
      setMaterials(list);
    } catch (e) {
      console.error(e);
      triggerToast("error", "Fetch Failed", "Could not load materials.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadData(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter]);

  const getGroupedData = () => {
    const groups = {};
    categories.forEach((c) => {
      groups[c.id] = { categoryId: c.id, categoryName: c.name, items: [] };
    });
    groups.uncategorized = { categoryId: "uncategorized", categoryName: "Uncategorized", items: [] };
    materials.forEach((m) => {
      const key = m.materialCategoryId || "uncategorized";
      if (!groups[key]) {
        groups[key] = {
          categoryId: key,
          categoryName: m.materialCategoryName || "Uncategorized",
          items: [],
        };
      }
      groups[key].items.push(m);
    });
    return Object.values(groups).filter((g) => g.items.length > 0 || categoryFilter === "All");
  };

  const resetForm = () => {
    setFormData({
      materialCategoryId: categories[0]?.id || "",
      name: "",
      code: "",
      unit: "PCS",
      costPrice: "",
      sellingPrice: "",
      supplier: "",
      sku: "",
      minStock: "",
      reorderQty: "",
      description: "",
    });
    setSelectedItem(null);
    setFormErrors({});
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      materialCategoryId: item.materialCategoryId || "",
      name: item.materialName || "",
      code: item.materialCode || "",
      unit: item.unitType || "PCS",
      costPrice: item.costPrice?.toString() || "",
      sellingPrice: item.sellingPrice?.toString() || "",
      supplier: item.supplierName || "",
      sku: item.sku || "",
      minStock: item.minStockLevel?.toString() || "",
      reorderQty: item.reorderQty?.toString() || "",
      description: item.description || "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !selectedItem && (!prev.code || prev.code.startsWith("MAT-"))) {
        next.code = `MAT-${value.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`;
      }
      return next;
    });
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Material name is required.";
    if (!formData.code.trim()) errors.code = "Material code is required.";
    if (!formData.costPrice || parseFloat(formData.costPrice) < 0) errors.costPrice = "Cost price is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        materialCategoryId: formData.materialCategoryId || null,
        materialName: formData.name.trim(),
        materialCode: formData.code.trim().toUpperCase(),
        unitType: formData.unit,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        supplierName: formData.supplier.trim() || null,
        sku: formData.sku.trim() || null,
        minStockLevel: formData.minStock ? parseFloat(formData.minStock) : 0,
        reorderQty: formData.reorderQty ? parseFloat(formData.reorderQty) : 0,
        description: formData.description.trim() || null,
      };
      if (selectedItem) {
        await updateMaterial(selectedItem.id, payload);
        triggerToast("success", "Updated", `Material "${payload.materialName}" updated.`);
      } else {
        await createMaterial(payload);
        triggerToast("success", "Created", `Material "${payload.materialName}" created.`);
      }
      setIsFormOpen(false);
      loadData();
      loadCategories();
    } catch (err) {
      triggerToast("error", "Save Failed", err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setIsLoading(true);
    try {
      await deleteMaterial(selectedItem.id);
      triggerToast("success", "Deleted", "Material removed.");
      setIsDeleteOpen(false);
      loadData();
    } catch (e) {
      triggerToast("error", "Delete Failed", "Could not delete material.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.code.trim()) return;
    setIsSaving(true);
    try {
      if (selectedCategory) {
        await updateMaterialCategory(selectedCategory.id, {
          name: categoryForm.name.trim(),
          code: categoryForm.code.trim().toUpperCase(),
        });
      } else {
        await createMaterialCategory({
          name: categoryForm.name.trim(),
          code: categoryForm.code.trim().toUpperCase(),
        });
      }
      setIsCategoryFormOpen(false);
      loadCategories();
      triggerToast("success", "Saved", "Category saved.");
    } catch (err) {
      triggerToast("error", "Failed", err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedData = getGroupedData();

  return (
    <ConfigurationLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <AlertCircle className="w-5 h-5" />
          <div>
            <h4 className="text-xs font-bold">{toast.title}</h4>
            <p className="text-[11px]">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-6">
        <PageHeader
          title="Materials Master"
          description="Define materials catalog with cost and reference selling prices for work item costing and procurement."
          actionLabel="Add Material"
          onAction={handleOpenAdd}
        />

        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center rounded-2xl bg-secondary/50 p-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] text-xs h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedCategory(null);
              setCategoryForm({ name: "", code: "" });
              setIsCategoryFormOpen(true);
            }}>
              Add Category
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : groupedData.length > 0 ? (
              <Table className="min-w-[900px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling (Ref)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((group) => {
                    const isCollapsed = collapsedCategories.has(group.categoryId);
                    const items = group.items || [];
                    return (
                      <React.Fragment key={group.categoryId}>
                        {items.map((item, idx) => (
                          <TableRow key={item.id} className="hover:bg-muted/20">
                            {idx === 0 && (
                              <TableCell rowSpan={isCollapsed ? 1 : items.length} className="align-top border-r bg-muted/5 font-semibold">
                                <button
                                  type="button"
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    setCollapsedCategories((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(group.categoryId)) next.delete(group.categoryId);
                                      else next.add(group.categoryId);
                                      return next;
                                    });
                                  }}
                                >
                                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  <Folder className="w-4 h-4 text-primary" />
                                  {group.categoryName}
                                </button>
                              </TableCell>
                            )}
                            {!isCollapsed && (
                              <>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium text-sm">{item.materialName}</div>
                                      <div className="text-[10px] text-muted-foreground">{item.materialCode}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">{item.unitType}</TableCell>
                                <TableCell className="text-xs font-medium">{formatCurrency(item.costPrice)}</TableCell>
                                <TableCell className="text-xs">{formatCurrency(item.sellingPrice)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{item.quantityOnHand ?? 0}</span>
                                    {item.lowStock && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => {
                                    setSelectedItem(item);
                                    setIsDeleteOpen(true);
                                  }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No materials defined"
                description="Add materials to build your catalog for costing and stock tracking."
                actionLabel="Add Material"
                onAction={handleOpenAdd}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <MasterFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedItem ? "Edit Material" : "Add Material"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.materialCategoryId || "none"} onValueChange={(v) => handleInputChange("materialCategoryId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={formData.unit} onValueChange={(v) => handleInputChange("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className={formErrors.name ? "border-destructive" : ""} />
            </div>
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())} className={formErrors.code ? "border-destructive" : ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label>Cost Price (AED) *</Label>
              <Input type="number" step="0.01" value={formData.costPrice} onChange={(e) => handleInputChange("costPrice", e.target.value)} className={formErrors.costPrice ? "border-destructive" : ""} />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (Ref)</Label>
              <Input type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => handleInputChange("sellingPrice", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => handleInputChange("supplier", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={formData.sku} onChange={(e) => handleInputChange("sku", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Stock Level</Label>
              <Input type="number" step="0.001" value={formData.minStock} onChange={(e) => handleInputChange("minStock", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reorder Qty</Label>
              <Input type="number" step="0.001" value={formData.reorderQty} onChange={(e) => handleInputChange("reorderQty", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Material"}</Button>
          </div>
        </form>
      </MasterFormModal>

      <MasterFormModal isOpen={isCategoryFormOpen} onClose={() => setIsCategoryFormOpen(false)} title="Material Category">
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input value={categoryForm.code} onChange={(e) => setCategoryForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCategoryFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>Save</Button>
          </div>
        </form>
      </MasterFormModal>

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Material"
        message={`Delete "${selectedItem?.materialName}"? This cannot be undone.`}
      />
    </ConfigurationLayout>
  );
}
