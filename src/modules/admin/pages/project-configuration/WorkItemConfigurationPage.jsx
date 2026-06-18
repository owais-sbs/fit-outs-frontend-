import React, { useState, useEffect } from "react";
import { 
  Search, Trash2, Copy, Filter, X, AlertCircle,
  ChevronLeft, ChevronDown, ChevronRight, Edit2, Folder
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

import { 
  fetchWorkItems, 
  createWorkItem, 
  updateWorkItem, 
  deleteWorkItem, 
  cloneWorkItem,
  fetchWorkItemMasters,
  createWorkItemMaster,
  updateWorkItemMaster,
  deleteWorkItemMaster
} from "../../api/work-item.api";

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

export default function WorkItemConfigurationPage() {
  const [workItems, setWorkItems] = useState([]);
  const [workItemMasters, setWorkItemMasters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Grouped collapse state
  const [collapsedMasters, setCollapsedMasters] = useState(new Set());

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Parent Category, 2 = Work Item specifications
  
  // Single Parent Category Edit Modal
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [selectedParentMaster, setSelectedParentMaster] = useState(null);
  const [parentEditData, setParentEditData] = useState({ name: "", code: "" });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isParentDeleteModalOpen, setIsParentDeleteModalOpen] = useState(false);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [workItemMasterIdFilter, setWorkItemMasterIdFilter] = useState("All");

  // Form Data (Two-Step Form)
  const [parentMode, setParentMode] = useState("existing"); // "existing" or "new"
  const [formData, setFormData] = useState({
    // Step 1: Parent Category
    workItemMasterId: "",
    newMasterName: "",
    newMasterCode: "",
    
    // Step 2: Work Item
    name: "",
    code: "",
    description: "",
    surface: [],
    unit: "SQFT",
    defaultRate: "",
    subcontractorRate: "",
    formula: "MANUAL",
    active: true
  });

  // Validation States
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Load Work Item Masters
  const loadWorkItemMasters = async () => {
    try {
      const res = await fetchWorkItemMasters();
      setWorkItemMasters(res || []);
    } catch (e) {
      console.error("Error loading work item masters", e);
      triggerToast("error", "Fetch Failed", "Could not retrieve work item master categories.");
    }
  };

  // Load Work Items
  const loadData = async () => {
    setIsLoading(true);
    try {
      const filterBody = {
        search: searchTerm.trim() !== "" ? searchTerm : null,
        workItemMasterId: workItemMasterIdFilter === "All" ? null : workItemMasterIdFilter
      };

      const res = await fetchWorkItems(filterBody, 0, 1000);
      setWorkItems(res.content || []);
    } catch (e) {
      console.error("Error fetching work items", e);
      triggerToast("error", "Fetch Failed", "Could not retrieve work items catalog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkItemMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, workItemMasterIdFilter]);

  // Toast auto-dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Group Work Items by Parent Category
  const getGroupedData = () => {
    const groups = {};
    
    // Ensure all masters are present
    workItemMasters.forEach(m => {
      groups[m.id] = {
        masterId: m.id,
        masterName: m.name,
        masterCode: m.code,
        items: []
      };
    });

    // Populate with work items
    workItems.forEach(w => {
      const mId = w.workItemMasterId || "unassigned";
      if (!groups[mId]) {
        groups[mId] = {
          masterId: mId,
          masterName: w.workItemMasterName || "Unassigned",
          masterCode: "UNASSIGNED",
          items: []
        };
      }
      groups[mId].items.push(w);
    });

    return Object.values(groups);
  };

  const toggleCollapseMaster = (masterId) => {
    const updated = new Set(collapsedMasters);
    if (updated.has(masterId)) {
      updated.delete(masterId);
    } else {
      updated.add(masterId);
    }
    setCollapsedMasters(updated);
  };

  // Form Management (Add / Edit)
  const handleOpenAddModal = () => {
    setFormErrors({});
    setFormStep(1);
    setParentMode("existing");
    setFormData({
      workItemMasterId: workItemMasters.length > 0 ? workItemMasters[0].id : "",
      newMasterName: "",
      newMasterCode: "",
      name: "",
      code: "",
      description: "",
      surface: [],
      unit: "SQFT",
      defaultRate: "",
      subcontractorRate: "",
      formula: "MANUAL",
      active: true
    });
    setSelectedItem(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormErrors({});
    setFormStep(1);
    setParentMode("existing");
    const surfaces = [];
    if (item.ceilingApplicable) surfaces.push("Ceiling");
    if (item.wallApplicable) surfaces.push("Wall");
    if (item.floorApplicable) surfaces.push("Floor");

    setFormData({
      workItemMasterId: item.workItemMasterId || "",
      newMasterName: "",
      newMasterCode: "",
      name: item.workItemName,
      code: item.workItemCode,
      description: item.description || "",
      surface: surfaces,
      unit: item.unitType || "SQFT",
      defaultRate: item.defaultRate?.toString() || "",
      subcontractorRate: item.subcontractorRate?.toString() || "",
      formula: item.quantityFormulaType || "MANUAL",
      active: item.active ?? true
    });
    setSelectedItem(item);
    setIsFormModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-code generation for parent category
      if (field === "newMasterName" && (!prev.newMasterCode || prev.newMasterCode === prev.newMasterName.replace(/\s+/g, "_").toUpperCase())) {
        next.newMasterCode = value.replace(/\s+/g, "_").toUpperCase();
      }

      // Auto-code generation for work item
      if (field === "name" && !selectedItem && (!prev.code || prev.code.startsWith("WI-"))) {
        next.code = `WI-${value.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`;
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

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (parentMode === "new") {
      if (!formData.newMasterName.trim()) errors.newMasterName = "Master category name is required.";
      if (!formData.newMasterCode.trim()) errors.newMasterCode = "Category code is required.";
    } else {
      if (!formData.workItemMasterId) errors.workItemMasterId = "Please select a master category.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Work item name is required.";

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
      errors.defaultRate = "Selling Price must be a positive number.";
    }

    const subRate = parseFloat(formData.subcontractorRate) || 0;
    if (!formData.subcontractorRate || subRate <= 0) {
      errors.subcontractorRate = "Subcontractor Price must be a positive number.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setFormStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) {
      triggerToast("error", "Validation Failed", "Please fix highlighted fields.");
      return;
    }

    setIsSaving(true);
    try {
      let masterId = formData.workItemMasterId;

      // 1. If parent is new, create it first
      if (parentMode === "new") {
        const newMaster = await createWorkItemMaster({
          name: formData.newMasterName.trim(),
          code: formData.newMasterCode.trim().toUpperCase()
        });
        masterId = newMaster.id;
      }

      // 2. Create or Update work item
      const payload = {
        workItemName: formData.name.trim(),
        workItemCode: formData.code.trim().toUpperCase(),
        workItemMasterId: masterId,
        description: formData.description.trim(),
        ceilingApplicable: formData.surface.includes("Ceiling"),
        wallApplicable: formData.surface.includes("Wall"),
        floorApplicable: formData.surface.includes("Floor"),
        unitType: formData.unit,
        defaultRate: parseFloat(formData.defaultRate),
        subcontractorRate: parseFloat(formData.subcontractorRate),
        quantityFormulaType: formData.formula,
        icon: "Wrench",
        colorTag: "blue"
      };

      if (selectedItem) {
        await updateWorkItem(selectedItem.id, payload);
        triggerToast("success", "Item Updated", `Work item "${payload.workItemName}" updated successfully.`);
      } else {
        await createWorkItem(payload);
        triggerToast("success", "Item Created", `Work item "${payload.workItemName}" has been created.`);
      }

      setIsFormModalOpen(false);
      loadWorkItemMasters();
      loadData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || "Failed to save work item.";
      triggerToast("error", "Failed to Save", errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloneClick = async (item, e) => {
    e.stopPropagation();
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

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
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
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Deletion Failed", "Failed to delete work item.");
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Parent Master Edit Handlers
  const handleOpenParentEditModal = (master, e) => {
    e.stopPropagation();
    setSelectedParentMaster(master);
    setParentEditData({
      name: master.name || master.masterName,
      code: master.code || master.masterCode
    });
    setIsParentEditModalOpen(true);
  };

  const handleParentEditSubmit = async (e) => {
    e.preventDefault();
    if (!parentEditData.name.trim() || !parentEditData.code.trim()) {
      triggerToast("error", "Validation Error", "All fields are required.");
      return;
    }

    setIsSaving(true);
    try {
      await updateWorkItemMaster(selectedParentMaster.masterId || selectedParentMaster.id, {
        name: parentEditData.name.trim(),
        code: parentEditData.code.trim().toUpperCase()
      });
      triggerToast("success", "Category Updated", "Master category has been updated successfully.");
      setIsParentEditModalOpen(false);
      loadWorkItemMasters();
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast("error", "Update Failed", "Could not update master category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleParentDeleteClick = (master, e) => {
    e.stopPropagation();
    setSelectedParentMaster(master);
    setIsParentDeleteModalOpen(true);
  };

  const handleConfirmParentDelete = async () => {
    setIsLoading(true);
    try {
      await deleteWorkItemMaster(selectedParentMaster.masterId || selectedParentMaster.id);
      triggerToast("success", "Category Deleted", "Master category deleted successfully.");
      setIsParentDeleteModalOpen(false);
      loadWorkItemMasters();
      loadData();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Deletion Failed", "Failed to delete category. Ensure it is empty first.");
    } finally {
      setIsLoading(false);
    }
  };

  const groupedData = getGroupedData();

  return (
    <ConfigurationLayout>
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all animate-in slide-in-from-top-5 duration-300 ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toast.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold">{toast.title}</h4>
            <p className="text-[11px] opacity-90">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="p-1 rounded-full hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        <PageHeader 
          title="Work Item Catalog" 
          description="Establish work categories (Parent Category) and their detailed child items with customer and subcontractor pricing."
          actionLabel="Add Work Category"
          onAction={handleOpenAddModal} 
        />

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 border rounded-lg shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search work items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Filter Master:</span>
            <Select value={workItemMasterIdFilter} onValueChange={setWorkItemMasterIdFilter}>
              <SelectTrigger className="w-[200px] text-xs h-[36px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {workItemMasters.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grouped Master Table */}
        <Card className="shadow-sm border">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : groupedData.length > 0 ? (
              <Table className="min-w-[950px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[25%]">Work Category (Parent)</TableHead>
                    <TableHead className="w-[25%]">Work Items (Child)</TableHead>
                    <TableHead className="w-[12%]">Unit Type</TableHead>
                    <TableHead className="w-[12%]">Selling Price (To Customer)</TableHead>
                    <TableHead className="w-[12%]">Subcontractor Price</TableHead>
                    <TableHead className="w-[14%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((group) => {
                    const isCollapsed = collapsedMasters.has(group.masterId);
                    const items = group.items || [];
                    const rowSpanVal = isCollapsed ? 1 : Math.max(1, items.length);

                    return (
                      <React.Fragment key={group.masterId}>
                        {items.length === 0 ? (
                          <TableRow className="hover:bg-transparent border-b">
                            <TableCell className="align-middle border-r bg-muted/5 font-semibold text-foreground">
                              <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                  <Folder className="w-4 h-4 text-primary" />
                                  <span>{group.masterName}</span>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => handleOpenParentEditModal(group, e)}
                                    className="h-6 w-6"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={(e) => handleParentDeleteClick(group, e)}
                                    className="h-6 w-6 hover:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell colSpan={5} className="text-muted-foreground italic text-xs py-4 text-center">
                              No work items defined under this category.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item, index) => {
                            if (isCollapsed && index > 0) return null;

                            return (
                              <TableRow key={item.id} className="hover:bg-muted/10 border-b">
                                {index === 0 && (
                                  <TableCell 
                                    rowSpan={rowSpanVal} 
                                    className="align-middle border-r bg-muted/5 font-semibold text-foreground"
                                  >
                                    <div className="flex items-center justify-between group">
                                      <div 
                                        className="flex items-center gap-2 cursor-pointer select-none"
                                        onClick={() => toggleCollapseMaster(group.masterId)}
                                      >
                                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        <Folder className="w-4 h-4 text-primary" />
                                        <span>{group.masterName}</span>
                                      </div>
                                      
                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => handleOpenParentEditModal(group, e)}
                                          className="h-6 w-6"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => handleParentDeleteClick(group, e)}
                                          className="h-6 w-6 hover:text-destructive"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                    {isCollapsed && (
                                      <span className="text-[10px] text-muted-foreground block mt-1 ml-6 font-normal">
                                        ({items.length} items hidden)
                                      </span>
                                    )}
                                  </TableCell>
                                )}

                                {!isCollapsed ? (
                                  <>
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{item.workItemName}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.workItemCode}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs px-2 py-1 bg-muted border rounded font-semibold text-primary">
                                        {UNIT_TYPES.find(u => u.value === item.unitType)?.label || item.unitType}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-bold text-xs text-foreground">
                                      AED {item.defaultRate?.toFixed(2) || "0.00"}
                                    </TableCell>
                                    <TableCell className="font-bold text-xs text-amber-700">
                                      AED {item.subcontractorRate?.toFixed(2) || "0.00"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => handleCloneClick(item, e)}
                                          className="h-8 w-8 hover:text-emerald-600"
                                          title="Clone"
                                        >
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleOpenEditModal(item)}
                                          className="h-8 w-8 hover:text-primary"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => handleDeleteClick(item, e)}
                                          className="h-8 w-8 hover:text-destructive"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                ) : (
                                  <TableCell colSpan={5} className="text-xs text-muted-foreground py-3 italic bg-muted/5">
                                    Category items collapsed. Click arrow to expand.
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                title="No Work Items mapped"
                description="Click 'Add Work Category' to start defining parent categories and pricing metrics."
                actionLabel="Create Work Category"
                onAction={handleOpenAddModal}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-Step Form Drawer Modal */}
      <MasterFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedItem ? `Edit Work Item` : "Add Work Item Specification"}
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b mb-4">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              formStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>1</span>
            <span className="text-xs font-semibold">Parent Category</span>
          </div>
          <div className="h-px bg-muted flex-1 mx-4" />
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
              formStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>2</span>
            <span className="text-xs font-semibold">Work Item Details</span>
          </div>
        </div>

        {formStep === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Category Mode</Label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setParentMode("existing")}
                  className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                    parentMode === "existing" ? "border-primary bg-primary/5 font-semibold text-primary" : "border-muted hover:bg-muted/10 text-muted-foreground"
                  }`}
                >
                  Choose Existing Category
                </div>
                <div 
                  onClick={() => setParentMode("new")}
                  className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                    parentMode === "new" ? "border-primary bg-primary/5 font-semibold text-primary" : "border-muted hover:bg-muted/10 text-muted-foreground"
                  }`}
                >
                  Create New Category
                </div>
              </div>
            </div>

            {parentMode === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="workItemMasterId">Parent Category *</Label>
                {workItemMasters.length > 0 ? (
                  <Select 
                    value={formData.workItemMasterId} 
                    onValueChange={(val) => handleInputChange("workItemMasterId", val)}
                  >
                    <SelectTrigger id="workItemMasterId" className={formErrors.workItemMasterId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select Parent Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {workItemMasters.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-amber-600 border border-amber-200 bg-amber-50 p-2 rounded">
                    No categories created yet. Click "Create New Category".
                  </div>
                )}
                {formErrors.workItemMasterId && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.workItemMasterId}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newMasterName">Category Name *</Label>
                  <Input 
                    id="newMasterName" 
                    placeholder="e.g. Demolition, Painting" 
                    value={formData.newMasterName}
                    onChange={(e) => handleInputChange("newMasterName", e.target.value)}
                    className={formErrors.newMasterName ? "border-destructive" : ""}
                  />
                  {formErrors.newMasterName && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.newMasterName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newMasterCode">Category Code *</Label>
                  <Input 
                    id="newMasterCode" 
                    placeholder="e.g. DEMOLITION" 
                    value={formData.newMasterCode}
                    onChange={(e) => handleInputChange("newMasterCode", e.target.value.toUpperCase())}
                    className={formErrors.newMasterCode ? "border-destructive" : ""}
                  />
                  {formErrors.newMasterCode && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {formErrors.newMasterCode}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNextStep}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Work Item Name *</Label>
                <Input
                  id="itemName"
                  required
                  placeholder="e.g. Premium Painting"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code *</Label>
                <Input
                  id="itemCode"
                  required
                  placeholder="e.g. WI-PAINT-01"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  className={formErrors.code ? "border-destructive" : ""}
                />
                {formErrors.code && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.code}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemUnit">Unit of Measurement (UOM) *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(val) => handleInputChange("unit", val)}
                >
                  <SelectTrigger id="itemUnit">
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemFormula">Quantity Formula Rules *</Label>
                <Select
                  value={formData.formula}
                  onValueChange={(val) => handleInputChange("formula", val)}
                >
                  <SelectTrigger id="itemFormula">
                    <SelectValue placeholder="Formula type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMULA_TYPES.map(formula => (
                      <SelectItem key={formula.value} value={formula.value}>{formula.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing fields (Our Price & Subcontractor Price) */}
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="defaultRate" className="font-bold text-foreground">Selling Price (Our Price) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">AED</span>
                  <Input
                    id="defaultRate"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className={`pl-7 font-bold ${formErrors.defaultRate ? "border-destructive" : ""}`}
                    value={formData.defaultRate}
                    onChange={(e) => handleInputChange("defaultRate", e.target.value)}
                  />
                </div>
                {formErrors.defaultRate && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.defaultRate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcontractorRate" className="font-bold text-amber-700">Subcontractor Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-amber-600">AED</span>
                  <Input
                    id="subcontractorRate"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className={`pl-7 font-bold text-amber-700 ${formErrors.subcontractorRate ? "border-destructive" : ""}`}
                    value={formData.subcontractorRate}
                    onChange={(e) => handleInputChange("subcontractorRate", e.target.value)}
                  />
                </div>
                {formErrors.subcontractorRate && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.subcontractorRate}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Applicable Surfaces *</Label>
              <div className="flex gap-4 pt-1">
                {["Ceiling", "Wall", "Floor"].map(surf => {
                  const isChecked = formData.surface.includes(surf);
                  return (
                    <div 
                      key={surf} 
                      onClick={() => handleSurfaceCheckboxChange(surf, !isChecked)}
                      className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-primary/5 border-primary text-primary font-bold shadow-xs" 
                          : "bg-background border-muted hover:bg-muted/10 text-muted-foreground"
                      }`}
                    >
                      <span className="text-xs">{surf}</span>
                    </div>
                  );
                })}
              </div>
              {formErrors.surface && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.surface}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemDesc">Description</Label>
              <Textarea
                id="itemDesc"
                placeholder="Grade of material, layers..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : selectedItem ? "Save Details" : "Create Item"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </MasterFormModal>

      {/* Edit Single Parent Category Modal */}
      <MasterFormModal
        isOpen={isParentEditModalOpen}
        onClose={() => setIsParentEditModalOpen(false)}
        title="Edit Master Category"
        className="sm:max-w-[480px]"
      >
        <form onSubmit={handleParentEditSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="editParentName">Category Name *</Label>
            <Input 
              id="editParentName" 
              required 
              value={parentEditData.name}
              onChange={(e) => setParentEditData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editParentCode">Category Code *</Label>
            <Input 
              id="editParentCode" 
              required 
              value={parentEditData.code}
              onChange={(e) => setParentEditData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsParentEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </form>
      </MasterFormModal>

      {/* Delete Confirmation Modal for Child */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Work Item"
        description={`Are you sure you want to delete "${selectedItem?.workItemName}"? This will unlink it from active configurations.`}
      />

      {/* Delete Confirmation Modal for Parent Master */}
      <DeleteConfirmationModal
        isOpen={isParentDeleteModalOpen}
        onClose={() => setIsParentDeleteModalOpen(false)}
        onConfirm={handleConfirmParentDelete}
        title="Delete Master Category"
        description={`Are you sure you want to delete the master category "${selectedParentMaster?.masterName || selectedParentMaster?.name}"? All subcategory items linked to it must be empty or unlinked.`}
      />
    </ConfigurationLayout>
  );
}
