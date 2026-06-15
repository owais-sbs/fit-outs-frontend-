import React, { useState, useEffect } from "react";
import { 
  Wrench, Search, Plus, Trash2, Copy, Download, Upload, 
  Filter, Check, X, AlertCircle, Layers, Grid, Square,
  Paintbrush, Hammer, Lightbulb, Play, Power,
  ChevronLeft, ChevronRight, Wind, Layout, Settings,
  Sparkles, Shield, ShieldAlert, Lock, Zap, Palette, HelpCircle
} from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import MasterTable from "../../components/shared/configuration/MasterTable";
import ActionButtons from "../../components/shared/configuration/ActionButtons";
import MasterFormModal from "../../components/shared/configuration/MasterFormModal";
import DeleteConfirmationModal from "../../components/shared/configuration/DeleteConfirmationModal";
import EmptyState from "../../components/shared/configuration/EmptyState";
import StatusBadge from "../../components/shared/configuration/StatusBadge";
import { TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  fetchWorkItems, 
  createWorkItem, 
  updateWorkItem, 
  deleteWorkItem, 
  activateWorkItem, 
  deactivateWorkItem, 
  cloneWorkItem 
} from "../../api/work-item.api";

// Comprehensive construction/fitout categories mapping to backend enums
const WORK_ITEM_CATEGORIES = [
  { value: "PAINTING", label: "Painting & Wall Treatment", icon: Paintbrush, color: "blue", iconName: "Paintbrush" },
  { value: "FLOORING", label: "Flooring & Skirting", icon: Grid, color: "orange", iconName: "Grid" },
  { value: "CEILING", label: "Ceiling & Partition", icon: Layers, color: "purple", iconName: "Layers" },
  { value: "WALL_TREATMENT", label: "Wall Panel & Cladding", icon: Square, color: "rose", iconName: "Square" },
  { value: "CARPENTRY", label: "Carpentry & Woodwork", icon: Hammer, color: "emerald", iconName: "Hammer" },
  { value: "PLUMBING", label: "Plumbing & Sanitary", icon: Wrench, color: "blue", iconName: "Wrench" },
  { value: "ELECTRICAL", label: "Electrical & Lighting", icon: Lightbulb, color: "yellow", iconName: "Lightbulb" },
  { value: "HVAC", label: "HVAC & Ventilation", icon: Wind, color: "sky", iconName: "Wind" },
  { value: "FIXTURES", label: "Fixtures & Furniture", icon: Layout, color: "indigo", iconName: "Layout" },
  { value: "HARDWARE", label: "Hardware & Fittings", icon: Settings, color: "slate", iconName: "Settings" },
  { value: "GLAZING", label: "Glass & Glazing", icon: Sparkles, color: "cyan", iconName: "Sparkles" },
  { value: "TILING", label: "Tiling Work", icon: Grid, color: "amber", iconName: "Grid" },
  { value: "INSULATION", label: "Insulation & Soundproofing", icon: Shield, color: "teal", iconName: "Shield" },
  { value: "DEMOLITION", label: "Demolition & Dismantling", icon: Trash2, color: "red", iconName: "Trash2" },
  { value: "CIVIL", label: "Civil & Masonry", icon: Hammer, color: "amber", iconName: "Hammer" },
  { value: "FIRE_PROTECTION", label: "Fire Fighting & Safety", icon: ShieldAlert, color: "red", iconName: "ShieldAlert" },
  { value: "SECURITY", label: "Security & Surveillance", icon: Lock, color: "slate", iconName: "Lock" },
  { value: "LOW_CURRENT", label: "Low Current & Networking", icon: Zap, color: "yellow", iconName: "Zap" },
  { value: "JOINERY", label: "Joinery Work", icon: Hammer, color: "emerald", iconName: "Hammer" },
  { value: "SOFT_FURNISHING", label: "Soft Furnishing", icon: Palette, color: "pink", iconName: "Palette" },
  { value: "OTHER", label: "Other / General", icon: HelpCircle, color: "slate", iconName: "HelpCircle" }
];

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
  { value: "BAG", label: "Bag" }
];

const FORMULA_TYPES = [
  { value: "AREA_ONLY", label: "Area Based" },
  { value: "LENGTH_ONLY", label: "Length Based" },
  { value: "CUSTOM", label: "Count Based" },
  { value: "MANUAL", label: "Manual Entry" }
];



const colorsMap = {
  blue: { bg: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  orange: { bg: "bg-orange-50 border-orange-200 text-orange-700", dot: "bg-orange-500" },
  purple: { bg: "bg-purple-50 border-purple-200 text-purple-700", dot: "bg-purple-500" },
  yellow: { bg: "bg-yellow-50 border-yellow-200 text-yellow-700", dot: "bg-yellow-500" },
  emerald: { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  slate: { bg: "bg-slate-50 border-slate-200 text-slate-700", dot: "bg-slate-500" },
  rose: { bg: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500" },
  sky: { bg: "bg-sky-50 border-sky-200 text-sky-700", dot: "bg-sky-500" },
  indigo: { bg: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500" },
  cyan: { bg: "bg-cyan-50 border-cyan-200 text-cyan-700", dot: "bg-cyan-500" },
  amber: { bg: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  teal: { bg: "bg-teal-50 border-teal-200 text-teal-700", dot: "bg-teal-500" },
  red: { bg: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
  pink: { bg: "bg-pink-50 border-pink-200 text-pink-700", dot: "bg-pink-500" }
};

export default function WorkItemConfigurationPage() {
  const [workItems, setWorkItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Pagination & Count
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Table Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [surfaceFilter, setSurfaceFilter] = useState({
    Ceiling: false,
    Wall: false,
    Floor: false
  });
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Form Fields State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "PAINTING",
    description: "",
    surface: [],
    unit: "SQFT",
    defaultRate: "",
    formula: "AREA_ONLY",
    active: true
  });

  // Validation & Toast Alerts
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Load from Storage or Backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const filterBody = {
        search: searchTerm.trim() !== "" ? searchTerm : null,
        category: categoryFilter === "All" ? null : categoryFilter,
        active: statusFilter === "All" ? null : (statusFilter === "Active"),
        ceilingApplicable: surfaceFilter.Ceiling ? true : null,
        wallApplicable: surfaceFilter.Wall ? true : null,
        floorApplicable: surfaceFilter.Floor ? true : null
      };

      const result = await fetchWorkItems(filterBody, currentPage - 1, itemsPerPage);
      setWorkItems(result.content || []);
      setTotalItems(result.totalElements || 0);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error("Failed fetching work items", e);
      triggerToast("error", "Failed to Fetch", "Could not connect to the server endpoints.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter, statusFilter, surfaceFilter, currentPage]);

  // Toast AutoDismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Bulk Operations
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowIds(new Set(workItems.map(item => item.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const updated = new Set(selectedRowIds);
    if (checked) {
      updated.add(id);
    } else {
      updated.delete(id);
    }
    setSelectedRowIds(updated);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedRowIds.size === 0) return;
    setIsLoading(true);
    try {
      for (const id of selectedRowIds) {
        if (newStatus) {
          await activateWorkItem(id);
        } else {
          await deactivateWorkItem(id);
        }
      }
      triggerToast("success", "Bulk Update Completed", `Updated status for selected items.`);
      setSelectedRowIds(new Set());
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Bulk Update Failed", "Failed to update some items.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    setIsLoading(true);
    try {
      for (const id of selectedRowIds) {
        await deleteWorkItem(id);
      }
      triggerToast("success", "Items Deleted", `Archived selected work items.`);
      setSelectedRowIds(new Set());
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Bulk Deletion Failed", "Failed to delete some items. Ensure they are not linked to rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  // Form calculations
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-generate code from name for new entries if not edited manually
      if (field === "name" && !selectedItem && (!prev.code || prev.code.startsWith("WI-"))) {
        const generated = `WI-${value.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`;
        next.code = generated;
      }
      return next;
    });

    if (formErrors[field]) {
      setFormErrors(prev => {
        const errors = { ...prev };
        delete errors[field];
        return errors;
      });
    }
  };

  const handleSurfaceCheckboxChange = (surf, checked) => {
    setFormData(prev => {
      const surface = prev.surface || [];
      const index = surface.indexOf(surf);
      const next = [...surface];
      if (checked && index === -1) {
        next.push(surf);
      } else if (!checked && index !== -1) {
        next.splice(index, 1);
      }
      return { ...prev, surface: next };
    });

    if (formErrors.surface) {
      setFormErrors(prev => {
        const errors = { ...prev };
        delete errors.surface;
        return errors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Work item name is required.";
    else if (formData.name.length < 3) errors.name = "Name must be at least 3 characters.";

    const codeRegex = /^[A-Z0-9-]{3,20}$/;
    if (!formData.code.trim()) errors.code = "Work item code is required.";
    else if (!codeRegex.test(formData.code)) {
      errors.code = "Code must be 3-20 characters, uppercase alphanumeric and hyphens only.";
    }

    if (formData.surface.length === 0) {
      errors.surface = "At least one applicable surface must be selected.";
    }

    const rate = parseFloat(formData.defaultRate) || 0;
    if (!formData.defaultRate || rate <= 0) {
      errors.defaultRate = "Default rate must be a positive number greater than 0.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD Actions
  const handleOpenFormModal = (item = null) => {
    setFormErrors({});
    if (item) {
      setSelectedItem(item);
      const surfaces = [];
      if (item.ceilingApplicable) surfaces.push("Ceiling");
      if (item.wallApplicable) surfaces.push("Wall");
      if (item.floorApplicable) surfaces.push("Floor");

      setFormData({
        name: item.workItemName,
        code: item.workItemCode,
        category: item.category || "PAINTING",
        description: item.description || "",
        surface: surfaces,
        unit: item.unitType || "SQFT",
        defaultRate: item.defaultRate?.toString() || "",
        formula: item.quantityFormulaType || "AREA_ONLY",
        active: item.active ?? true
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: "",
        code: "",
        category: "PAINTING",
        description: "",
        surface: [],
        unit: "SQFT",
        defaultRate: "",
        formula: "AREA_ONLY",
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerToast("error", "Form Validation Failed", "Please fix the highlighted errors before saving.");
      return;
    }

    setIsSaving(true);
    // Find category metadata to dynamically fetch icon & colorTag based on Category they selected
    const catMeta = WORK_ITEM_CATEGORIES.find(c => c.value === formData.category) || WORK_ITEM_CATEGORIES[WORK_ITEM_CATEGORIES.length - 1];

    const payload = {
      workItemName: formData.name.trim(),
      workItemCode: formData.code.trim().toUpperCase(),
      category: formData.category,
      description: formData.description.trim(),
      ceilingApplicable: formData.surface.includes("Ceiling"),
      wallApplicable: formData.surface.includes("Wall"),
      floorApplicable: formData.surface.includes("Floor"),
      unitType: formData.unit,
      defaultRate: parseFloat(formData.defaultRate),
      quantityFormulaType: formData.formula,
      icon: catMeta.iconName,
      colorTag: catMeta.color,
      subcontractorRate: 0, // Simplified to single price
      markupPercentage: 0 // Simplified to single price
    };

    try {
      if (selectedItem) {
        await updateWorkItem(selectedItem.id, payload);
        triggerToast("success", "Item Updated", `Work item "${payload.workItemName}" updated successfully.`);
      } else {
        await createWorkItem(payload);
        triggerToast("success", "Item Created", `Work item "${payload.workItemName}" has been created.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "Endpoint error occurred.";
      triggerToast("error", "Failed to Save", errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneClick = async (item) => {
    setIsLoading(true);
    try {
      await cloneWorkItem(item.id);
      triggerToast("success", "Item Cloned", `Successfully cloned "${item.workItemName}".`);
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Clone Failed", "API endpoint failed to clone work item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    setIsLoading(true);
    try {
      await deleteWorkItem(selectedItem.id);
      triggerToast("success", "Item Deleted", `Work item "${selectedItem.workItemName}" has been deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || "Failed to delete. Ensure it's not a default in a room template.";
      triggerToast("error", "Deletion Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    setIsLoading(true);
    try {
      if (item.active) {
        await deactivateWorkItem(item.id);
        triggerToast("success", "Item Deactivated", `"${item.workItemName}" has been deactivated.`);
      } else {
        await activateWorkItem(item.id);
        triggerToast("success", "Item Activated", `"${item.workItemName}" has been activated.`);
      }
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Status Toggle Failed", "Server error updating status.");
    } finally {
      setIsLoading(false);
    }
  };

  // Client side exports
  const handleExportCSV = () => {
    const headers = ["Work Item Name", "Code", "Category", "Surface Applicability", "Unit", "Rate", "Formula Type", "Status"];
    const rows = workItems.map(item => {
      const surfaces = [];
      if (item.ceilingApplicable) surfaces.push("Ceiling");
      if (item.wallApplicable) surfaces.push("Wall");
      if (item.floorApplicable) surfaces.push("Floor");
      return [
        `"${item.workItemName}"`,
        item.workItemCode,
        item.category,
        `"${surfaces.join(", ")}"`,
        item.unitType,
        item.defaultRate,
        item.quantityFormulaType,
        item.active ? "Active" : "Inactive"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QAS_Work_Item_Master_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("success", "Export Completed", "Work item catalog CSV file downloaded.");
  };

  // CSV Drag and Drop simulated parser
  const handleCSVImportSubmit = (e) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    
    setTimeout(async () => {
      try {
        const payload1 = {
          workItemName: "Simulated Custom Civil Screed",
          workItemCode: "CIVIL-SCR-99",
          category: "CIVIL",
          description: "Simulated CSV Imported civil floor screeding",
          ceilingApplicable: false,
          wallApplicable: false,
          floorApplicable: true,
          unitType: "SQFT",
          defaultRate: 45.0,
          quantityFormulaType: "AREA_ONLY",
          icon: "Hammer",
          colorTag: "amber"
        };
        await createWorkItem(payload1);
        setIsImporting(false);
        setIsImportModalOpen(false);
        setImportFile(null);
        triggerToast("success", "Import Succeeded", "Successfully parsed and saved simulated CSV items.");
        loadData();
      } catch (err) {
        setIsImporting(false);
        triggerToast("error", "Import Failed", "Server API rejected import payload.");
      }
    }, 1200);
  };

  const handleSurfaceFilterToggle = (surf) => {
    setSurfaceFilter(prev => ({ ...prev, [surf]: !prev[surf] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    triggerToast("success", "Copied", `Work Item Code "${text}" copied.`);
  };

  return (
    <ConfigurationLayout>
      <div className="flex flex-col gap-6 w-full h-full relative">
        {/* Custom Toast Alert */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-top-4 ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}>
            {toast.type === "success" ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
            <div>
              <p className="font-semibold text-sm">{toast.title}</p>
              <p className="text-xs opacity-90">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-4 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Work Item Master</h1>
            <p className="text-muted-foreground mt-1">Configure itemized default rates, unit types, applicability, and quantity formulas.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="h-9 px-3">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 px-3">
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </Button>
            <Button onClick={() => handleOpenFormModal()} className="h-9 px-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Work Item
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col gap-4 bg-card p-4 border rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Filters:</span>
              </div>

              {/* Surface type pills */}
              <div className="flex bg-muted p-1 rounded-md border text-xs gap-1">
                {["Ceiling", "Wall", "Floor"].map(surf => {
                  const isActive = surfaceFilter[surf];
                  return (
                    <button
                      key={surf}
                      onClick={() => handleSurfaceFilterToggle(surf)}
                      className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
                        isActive 
                          ? "bg-background shadow text-foreground font-semibold" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {surf}
                    </button>
                  );
                })}
              </div>

              {/* Category selector */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] text-xs h-[32px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {WORK_ITEM_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Select */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] text-xs h-[32px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active Only</SelectItem>
                  <SelectItem value="Inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Master Catalog Data Table */}
        <Card className="shadow-sm border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-6 w-[120px]" />
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 items-center py-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-8 w-1/6" />
                    <Skeleton className="h-8 w-1/12" />
                    <Skeleton className="h-8 w-1/12" />
                    <Skeleton className="h-8 w-[100px] ml-auto" />
                  </div>
                ))}
              </div>
            ) : workItems.length > 0 ? (
              <div>
                <MasterTable
                  columns={[
                    { label: (
                      <Checkbox 
                        checked={selectedRowIds.size === workItems.length && workItems.length > 0} 
                        onCheckedChange={handleSelectAll} 
                      />
                    ), className: "w-[40px]" },
                    { label: "Work Item" },
                    { label: "Code" },
                    { label: "Category" },
                    { label: "Unit" },
                    { label: "Surfaces" },
                    { label: "Default Rate", className: "w-[150px]" },
                    { label: "Status", className: "w-[120px]" },
                    { label: "Actions", className: "w-[120px] text-right" }
                  ]}
                  data={workItems}
                  expandable={false}
                  renderRow={(row) => {
                    const matchedCategory = WORK_ITEM_CATEGORIES.find(c => c.value === row.category) || WORK_ITEM_CATEGORIES[WORK_ITEM_CATEGORIES.length - 1];
                    const matchedColor = colorsMap[matchedCategory.color] || colorsMap.slate;
                    const IconComponent = matchedCategory.icon || HelpCircle;

                    const surfaces = [];
                    if (row.ceilingApplicable) surfaces.push("C");
                    if (row.wallApplicable) surfaces.push("W");
                    if (row.floorApplicable) surfaces.push("F");

                    const unitLabel = UNIT_TYPES.find(u => u.value === row.unitType)?.label || row.unitType;
                    const formulaLabel = FORMULA_TYPES.find(f => f.value === row.quantityFormulaType)?.label || row.quantityFormulaType;

                    return (
                      <>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRowIds.has(row.id)} 
                            onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded border ${matchedColor.bg}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{row.workItemName}</p>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{formulaLabel}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 group/code">
                            <code className="text-xs font-mono font-semibold px-2 py-0.5 bg-muted rounded border text-slate-600">
                              {row.workItemCode}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(row.workItemCode)}
                              className="p-1 opacity-0 group-hover/code:opacity-100 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-700 px-2.5 py-1 bg-slate-100 rounded border border-slate-200">
                            {matchedCategory.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                            {unitLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 text-[10px] font-mono">
                            {surfaces.map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-slate-100 rounded border text-muted-foreground font-semibold">{s}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-slate-900">₹ {row.defaultRate?.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={row.active} 
                              onCheckedChange={() => handleToggleActive(row)} 
                            />
                            <StatusBadge status={row.active} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCloneClick(row)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Clone Item"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <ActionButtons
                              onEdit={() => handleOpenFormModal(row)}
                              onDelete={() => handleDeleteClick(row)}
                            />
                          </div>
                        </TableCell>
                      </>
                    );
                  }}
                />

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t bg-card text-xs text-muted-foreground">
                  <div>
                    Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} work items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>

              </div>
            ) : (
              <EmptyState
                title={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? "No Matching Work Items" : "No Work Items Established"}
                description="Populate work items with rates and metrics to calculate construction quantities and BOQ values."
                actionLabel={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? "Clear Search Filters" : "Establish Work Item"}
                onAction={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? () => { setSearchTerm(""); setCategoryFilter("All"); setStatusFilter("All"); setSurfaceFilter({ Ceiling: false, Wall: false, Floor: false }); } : () => handleOpenFormModal()}
              />
            )}
          </CardContent>
        </Card>

        {/* Sticky Selected Actions Bar */}
        {selectedRowIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-100 rounded-full shadow-2xl animate-in slide-in-from-bottom-8">
            <span className="text-xs font-semibold">{selectedRowIds.size} Selected</span>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkStatusChange(true)}
                className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Play className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Activate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkStatusChange(false)}
                className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Power className="w-3.5 h-3.5 mr-1 text-amber-500" /> Deactivate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
            <button 
              onClick={() => setSelectedRowIds(new Set())}
              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <MasterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? `Edit Work Item: ${formData.code}` : "Configure Work Item Master"}
        className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b pb-5">
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-1 text-foreground">Basic Specs</h3>
              
              <div className="space-y-2">
                <Label htmlFor="wiName">Work Item Name *</Label>
                <Input 
                  id="wiName" 
                  required 
                  placeholder="e.g. 12mm Gypsum Board False Ceiling" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wiCode">Work Item Code *</Label>
                  <Input 
                    id="wiCode" 
                    required 
                    placeholder="e.g. GYP-CLG-01" 
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    className={formErrors.code ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiCategory">Category *</Label>
                  <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                    <SelectTrigger id="wiCategory">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ITEM_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formErrors.code && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="wiDesc">Description</Label>
                <Textarea 
                  id="wiDesc" 
                  placeholder="Technical specifications, brand preferences, or detailed drawings." 
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Applicable Surface *</Label>
                <div className="flex items-center gap-4 border p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="surfCeiling" 
                      checked={formData.surface.includes("Ceiling")} 
                      onCheckedChange={(checked) => handleSurfaceCheckboxChange("Ceiling", checked)}
                    />
                    <Label htmlFor="surfCeiling" className="text-xs font-semibold cursor-pointer">Ceiling</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="surfWall" 
                      checked={formData.surface.includes("Wall")} 
                      onCheckedChange={(checked) => handleSurfaceCheckboxChange("Wall", checked)}
                    />
                    <Label htmlFor="surfWall" className="text-xs font-semibold cursor-pointer">Wall</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="surfFloor" 
                      checked={formData.surface.includes("Floor")} 
                      onCheckedChange={(checked) => handleSurfaceCheckboxChange("Floor", checked)}
                    />
                    <Label htmlFor="surfFloor" className="text-xs font-semibold cursor-pointer">Floor</Label>
                  </div>
                </div>
                {formErrors.surface && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.surface}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Rate & Formulas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-1 text-foreground">Quantity & Pricing</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="wiUnit">Unit of Measure *</Label>
                  <Select value={formData.unit} onValueChange={(val) => handleInputChange("unit", val)}>
                    <SelectTrigger id="wiUnit">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map(u => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wiFormula">Quantity Formula *</Label>
                  <Select value={formData.formula} onValueChange={(val) => handleInputChange("formula", val)}>
                    <SelectTrigger id="wiFormula">
                      <SelectValue placeholder="Formula Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMULA_TYPES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Formula Info card */}
              <div className="text-[11px] bg-slate-50 border p-3 rounded-lg text-slate-600 font-medium">
                <span className="font-bold text-slate-800 uppercase tracking-wide block mb-1">Formula Applied</span>
                {formData.formula === "AREA_ONLY" && "Quantity = Room Length × Room Width (Ceiling/Floor) or Room Perimeter × Height (Walls)"}
                {formData.formula === "LENGTH_ONLY" && "Quantity = Linear Room Perimeter (for skirting/molding/coves)"}
                {formData.formula === "CUSTOM" && "Quantity = Integer Count of components assigned manually (light fixtures, doors)"}
                {formData.formula === "MANUAL" && "Quantity entered manually on-site by Survey Engineers (no auto-calculation)"}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="wiRate">Default Rate (INR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground font-semibold">₹</span>
                  <Input 
                    id="wiRate" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    placeholder="0.00" 
                    value={formData.defaultRate}
                    onChange={(e) => handleInputChange("defaultRate", e.target.value)}
                    className={`pl-7 ${formErrors.defaultRate ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {formErrors.defaultRate && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.defaultRate}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">Standard rate per unit of measure used in calculation of BOQ values.</p>
              </div>

              {/* Dynamic Branding Display info */}
              <div className="p-3 bg-muted/30 border rounded-lg space-y-1 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider block text-[10px]">Visual Branding (Auto-Assigned)</span>
                <div className="flex items-center gap-3 pt-1">
                  {(() => {
                    const meta = WORK_ITEM_CATEGORIES.find(c => c.value === formData.category) || WORK_ITEM_CATEGORIES[WORK_ITEM_CATEGORIES.length - 1];
                    const ColorClass = colorsMap[meta.color] || colorsMap.slate;
                    const IconComponent = meta.icon || HelpCircle;
                    return (
                      <>
                        <div className={`p-2 rounded border ${ColorClass.bg}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-foreground">{meta.color} Theme</p>
                          <p className="text-[10px] text-muted-foreground">Matches category: {meta.label}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : selectedItem ? "Save Work Item" : "Establish Work Item"}
            </Button>
          </div>
        </form>
      </MasterFormModal>

      {/* CSV Import Modal */}
      <MasterFormModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Simulated Bulk CSV Import"
        className="sm:max-w-[450px]"
      >
        <form onSubmit={handleCSVImportSubmit} className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upload a spreadsheet matching the catalog structure to import new rates. Columns required: 
            <code className="text-[10px] bg-muted px-1 rounded block mt-1 py-0.5 border">Item Name, Code, Category, Surface, Unit, Rate, Formula</code>
          </p>

          <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => document.getElementById("csvFileInput").click()}>
            <input 
              id="csvFileInput" 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => setImportFile(e.target.files[0])}
            />
            <Upload className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
            <span className="text-xs font-semibold text-foreground block">
              {importFile ? importFile.name : "Drag & Drop CSV File"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Supports standard CSV formatted spreadsheets up to 5MB."}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!importFile || isImporting}>
              {isImporting ? "Parsing and Validating..." : "Execute Bulk Import"}
            </Button>
          </div>
        </form>
      </MasterFormModal>

      {/* Delete/Archive Confirmation */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Archive Work Item Master Rate"
        description={`Are you sure you want to remove the work item "${selectedItem?.workItemName}"? It will be archived and won't be calculated on future site bills.`}
      />
    </ConfigurationLayout>
  );
}
