import React, { useState, useEffect } from "react";
import { 
  Grid, Search, Eye, Filter, Check, X, Layout, 
  Layers, Square, Trash2, Play, Power, 
  ChevronRight, ChevronDown, AlertCircle, CheckSquare, Plus, Edit2, Folder, ChevronLeft
} from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import MasterFormModal from "../../components/shared/configuration/MasterFormModal";
import DeleteConfirmationModal from "../../components/shared/configuration/DeleteConfirmationModal";
import EmptyState from "../../components/shared/configuration/EmptyState";
import StatusBadge from "../../components/shared/configuration/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  fetchRoomTypes, 
  createRoomType, 
  updateRoomType, 
  deleteRoomType, 
  activateRoomType, 
  deactivateRoomType,
  fetchRoomMasters,
  createRoomMaster,
  updateRoomMaster,
  deleteRoomMaster
} from "../../api/room-type.api";

import { fetchWorkItems } from "../../api/work-item.api";

export default function RoomConfigurationPage() {
  const [rooms, setRooms] = useState([]);
  const [roomMasters, setRoomMasters] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Grouped collapse state
  const [collapsedMasters, setCollapsedMasters] = useState(new Set());

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Parent Category, 2 = Subcategory Specs
  
  // Single Parent Category Edit Modal
  const [isParentEditModalOpen, setIsParentEditModalOpen] = useState(false);
  const [selectedParentMaster, setSelectedParentMaster] = useState(null);
  const [parentEditData, setParentEditData] = useState({ name: "", code: "" });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [isParentDeleteModalOpen, setIsParentDeleteModalOpen] = useState(false);

  // Table Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roomMasterIdFilter, setRoomMasterIdFilter] = useState("All");

  // Form Data (Two-Step Form)
  const [parentMode, setParentMode] = useState("existing"); // "existing" or "new"
  const [formData, setFormData] = useState({
    // Step 1: Parent Category
    roomMasterId: "",
    newMasterName: "",
    newMasterCode: "",
    
    // Step 2: Subcategory
    name: "",
    code: "",
    description: "",
    active: true,
    ceilingRequired: true,
    wallRequired: true,
    floorRequired: true,
    defaultWorkItemIds: []
  });

  // Validation States
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Load Room Masters
  const loadRoomMasters = async () => {
    try {
      const result = await fetchRoomMasters();
      setRoomMasters(result || []);
    } catch (e) {
      console.error("Error loading room masters", e);
      triggerToast("error", "Fetch Failed", "Could not retrieve room master categories.");
    }
  };

  // Load all rooms and work items
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const filterBody = {
        search: searchTerm.trim() !== "" ? searchTerm : null,
        roomMasterId: roomMasterIdFilter === "All" ? null : roomMasterIdFilter
      };

      // Load all room types without pagination to facilitate grouping
      const result = await fetchRoomTypes(filterBody, 0, 1000);
      setRooms(result.content || []);
    } catch (e) {
      console.error("Error loading room types", e);
      triggerToast("error", "Fetch Failed", "Could not retrieve room configurations.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllWorkItems = async () => {
    try {
      const res = await fetchWorkItems({ active: true }, 0, 1000);
      setWorkItems(res.content || []);
    } catch (e) {
      console.error("Error loading work items catalog", e);
    }
  };

  useEffect(() => {
    loadRoomMasters();
    loadAllWorkItems();
  }, []);

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roomMasterIdFilter]);

  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // Group Rooms by Parent Category
  const getGroupedData = () => {
    const groups = {};
    
    // Make sure all masters are present, even if they have no subcategories
    roomMasters.forEach(m => {
      groups[m.id] = {
        masterId: m.id,
        masterName: m.name,
        masterCode: m.code,
        items: []
      };
    });

    // Populate with room types
    rooms.forEach(r => {
      const mId = r.roomMasterId || "unassigned";
      if (!groups[mId]) {
        groups[mId] = {
          masterId: mId,
          masterName: r.roomMasterName || "Unassigned",
          masterCode: "UNASSIGNED",
          items: []
        };
      }
      groups[mId].items.push(r);
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

  // Form Management (Add / Edit Subcategory)
  const handleOpenAddModal = () => {
    setFormErrors({});
    setFormStep(1);
    setParentMode("existing");
    setFormData({
      roomMasterId: roomMasters.length > 0 ? roomMasters[0].id : "",
      newMasterName: "",
      newMasterCode: "",
      name: "",
      code: "",
      description: "",
      active: true,
      ceilingRequired: true,
      wallRequired: true,
      floorRequired: true,
      defaultWorkItemIds: []
    });
    setSelectedRoom(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    setFormErrors({});
    setFormStep(1);
    setParentMode("existing");
    const itemIds = room.workItems ? Array.from(room.workItems).map(item => item.id) : [];
    
    setFormData({
      roomMasterId: room.roomMasterId || "",
      newMasterName: "",
      newMasterCode: "",
      name: room.roomTypeName,
      code: room.roomCode,
      description: room.description || "",
      active: room.active ?? true,
      ceilingRequired: room.ceilingMeasurementRequired ?? false,
      wallRequired: room.wallMeasurementRequired ?? false,
      floorRequired: room.floorMeasurementRequired ?? false,
      defaultWorkItemIds: itemIds
    });
    setSelectedRoom(room);
    setIsFormModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-code generation for category
      if (field === "newMasterName" && (!prev.newMasterCode || prev.newMasterCode === prev.newMasterName.replace(/\s+/g, "_").toUpperCase())) {
        next.newMasterCode = value.replace(/\s+/g, "_").toUpperCase();
      }
      
      // Auto-code generation for room subcategory
      if (field === "name" && !selectedRoom && (!prev.code || prev.code === `RM-${prev.name.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`)) {
        next.code = `RM-${value.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`;
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

  const handleWorkItemToggle = (itemId) => {
    setFormData(prev => {
      const current = prev.defaultWorkItemIds || [];
      const index = current.indexOf(itemId);
      const next = [...current];
      if (index === -1) {
        next.push(itemId);
      } else {
        next.splice(index, 1);
      }
      return { ...prev, defaultWorkItemIds: next };
    });
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (parentMode === "new") {
      if (!formData.newMasterName.trim()) errors.newMasterName = "Master Category name is required.";
      if (!formData.newMasterCode.trim()) errors.newMasterCode = "Category code is required.";
    } else {
      if (!formData.roomMasterId) errors.roomMasterId = "Please select a master category.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Room Subcategory name is required.";
    
    const codeRegex = /^RM-[A-Z0-9-]{2,20}$/;
    if (!formData.code.trim()) errors.code = "Room code is required.";
    else if (!codeRegex.test(formData.code)) {
      errors.code = "Code must begin with 'RM-' followed by uppercase letters, numbers, or dashes.";
    }

    if (!formData.ceilingRequired && !formData.wallRequired && !formData.floorRequired) {
      errors.applicability = "Please select at least one applicable surface.";
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
      triggerToast("error", "Validation Failed", "Please correct the highlighted errors.");
      return;
    }

    setIsSaving(true);
    try {
      let masterId = formData.roomMasterId;

      // 1. If parent is new, create it first
      if (parentMode === "new") {
        const newMaster = await createRoomMaster({
          name: formData.newMasterName.trim(),
          code: formData.newMasterCode.trim().toUpperCase()
        });
        masterId = newMaster.id;
      }

      // 2. Create or Update room type
      const payload = {
        roomTypeName: formData.name.trim(),
        roomCode: formData.code.trim().toUpperCase(),
        roomMasterId: masterId,
        description: formData.description.trim(),
        ceilingMeasurementRequired: formData.ceilingRequired,
        wallMeasurementRequired: formData.wallRequired,
        floorMeasurementRequired: formData.floorRequired,
        workItemIds: formData.defaultWorkItemIds
      };

      if (selectedRoom) {
        await updateRoomType(selectedRoom.id, payload);
        triggerToast("success", "Updated Successfully", `Room type "${payload.roomTypeName}" has been updated.`);
      } else {
        await createRoomType(payload);
        triggerToast("success", "Created Successfully", `Room type "${payload.roomTypeName}" has been added.`);
      }

      setIsFormModalOpen(false);
      loadRoomMasters();
      loadRooms();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Failed to save room configuration.";
      triggerToast("error", "Failed to Save", msg);
    } finally {
      setIsSaving(false);
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
      await updateRoomMaster(selectedParentMaster.masterId || selectedParentMaster.id, {
        name: parentEditData.name.trim(),
        code: parentEditData.code.trim().toUpperCase()
      });
      triggerToast("success", "Category Updated", "Master category has been updated successfully.");
      setIsParentEditModalOpen(false);
      loadRoomMasters();
      loadRooms();
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
      await deleteRoomMaster(selectedParentMaster.masterId || selectedParentMaster.id);
      triggerToast("success", "Category Deleted", "Master category deleted successfully.");
      setIsParentDeleteModalOpen(false);
      loadRoomMasters();
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Deletion Failed", "Failed to delete category. Ensure it is empty first.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Subcategory Handlers
  const handleDeleteClick = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    try {
      await deleteRoomType(selectedRoom.id);
      triggerToast("success", "Template Deleted", `Room type "${selectedRoom.roomTypeName}" deleted.`);
      setIsDeleteModalOpen(false);
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Deletion Failed", "Could not delete room subcategory.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (room) => {
    setIsLoading(true);
    try {
      if (room.active) {
        await deactivateRoomType(room.id);
        triggerToast("success", "Deactivated", `"${room.roomTypeName}" has been set to inactive.`);
      } else {
        await activateRoomType(room.id);
        triggerToast("success", "Activated", `"${room.roomTypeName}" is now active.`);
      }
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Action Failed", "Could not toggle active state.");
    } finally {
      setIsLoading(false);
    }
  };

  const groupedData = getGroupedData();

  return (
    <ConfigurationLayout>
      {/* Toast System */}
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
          title="Room Configurations" 
          description="Establish and map room categories (Parent Category) and their detailed types (Sub Category)."
          actionLabel="Add Room Category" 
          onAction={handleOpenAddModal} 
        />

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 border rounded-lg shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subcategory rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Filter Master:</span>
            <Select value={roomMasterIdFilter} onValueChange={setRoomMasterIdFilter}>
              <SelectTrigger className="w-[200px] text-xs h-[36px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {roomMasters.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grouped Master Table Grid */}
        <Card className="shadow-sm border">
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : groupedData.length > 0 ? (
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[30%]">Parent Category</TableHead>
                    <TableHead className="w-[45%]">Sub Category (Room Type)</TableHead>
                    <TableHead className="w-[10%] text-center">Status</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((group) => {
                    const isCollapsed = collapsedMasters.has(group.masterId);
                    const items = group.items || [];
                    const rowSpanVal = isCollapsed ? 1 : Math.max(1, items.length);

                    return (
                      <React.Fragment key={group.masterId}>
                        {/* First subcategory row renders the Parent Category cell with rowspan */}
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
                            <TableCell colSpan={3} className="text-muted-foreground italic text-xs py-4 text-center">
                              No room subcategories mapped to this category.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((room, index) => {
                            if (isCollapsed && index > 0) return null;

                            return (
                              <TableRow key={room.id} className="hover:bg-muted/10 border-b">
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
                                        ({items.length} subcategories hidden)
                                      </span>
                                    )}
                                  </TableCell>
                                )}

                                {!isCollapsed ? (
                                  <>
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{room.roomTypeName}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground mt-0.5">{room.roomCode}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        <Switch 
                                          checked={room.active} 
                                          onCheckedChange={() => handleToggleActive(room)} 
                                        />
                                        <StatusBadge status={room.active} />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleOpenEditModal(room)}
                                          className="h-8 w-8 hover:text-primary"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteClick(room)}
                                          className="h-8 w-8 hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </>
                                ) : (
                                  /* When collapsed, we only render a placeholder text cell for the rest of the columns in index 0 */
                                  <TableCell colSpan={3} className="text-xs text-muted-foreground py-3 italic bg-muted/5">
                                    Parent configuration collapsed. Click arrow to expand details.
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
                title="No Configuration Matches"
                description="Click 'Add Room Category' to start defining your parent categories and room specifications."
                actionLabel="Create First Room Category"
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
        title={selectedRoom ? `Edit Room Configuration` : "Add Room Configuration"}
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
            <span className="text-xs font-semibold">Subcategory Specifications</span>
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
                <Label htmlFor="roomMasterId">Parent Category *</Label>
                {roomMasters.length > 0 ? (
                  <Select 
                    value={formData.roomMasterId} 
                    onValueChange={(val) => handleInputChange("roomMasterId", val)}
                  >
                    <SelectTrigger id="roomMasterId" className={formErrors.roomMasterId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select Parent Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomMasters.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-amber-600 border border-amber-200 bg-amber-50 p-2 rounded">
                    No categories created yet. Click "Create New Category" instead.
                  </div>
                )}
                {formErrors.roomMasterId && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.roomMasterId}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newMasterName">Category Name *</Label>
                  <Input 
                    id="newMasterName" 
                    placeholder="e.g. Bedroom, Balcony" 
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
                    placeholder="e.g. BEDROOM" 
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Subcategory Name *</Label>
                <Input 
                  id="roomName" 
                  required
                  placeholder="e.g. Guest Bedroom" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code *</Label>
                <Input 
                  id="roomCode" 
                  required
                  placeholder="e.g. RM-BED-02" 
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  className={formErrors.code ? "border-destructive" : ""}
                />
                {formErrors.code && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomDesc">Description</Label>
              <Textarea 
                id="roomDesc" 
                placeholder="Details about dimensions, typical layout instructions..." 
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Surface checklist */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Measurement Applicability</Label>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  onClick={() => handleInputChange("ceilingRequired", !formData.ceilingRequired)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.ceilingRequired ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  <Layers className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px]">Ceiling</span>
                </div>
                <div 
                  onClick={() => handleInputChange("wallRequired", !formData.wallRequired)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.wallRequired ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  <Square className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px]">Wall</span>
                </div>
                <div 
                  onClick={() => handleInputChange("floorRequired", !formData.floorRequired)}
                  className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.floorRequired ? "border-primary bg-primary/5 text-primary font-bold shadow-xs" : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  <Grid className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px]">Floor</span>
                </div>
              </div>
              {formErrors.applicability && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.applicability}
                </p>
              )}
            </div>

            {/* Scope bindings */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Default Work Scope Items</Label>
              <div className="border rounded-lg bg-background p-2 max-h-[160px] overflow-y-auto space-y-1">
                {workItems.length > 0 ? (
                  workItems.map(item => {
                    const isChecked = formData.defaultWorkItemIds.includes(item.id);
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleWorkItemToggle(item.id)}
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/30 transition-colors ${
                          isChecked ? "border-primary/50 bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center transition-colors pointer-events-none ${
                            isChecked ? "bg-primary text-primary-foreground" : "bg-background"
                          }`}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                            {item.workItemName}
                          </span>
                        </div>
                        <code className="text-[9px] text-muted-foreground uppercase bg-muted border px-1.5 py-0.5 rounded font-mono">
                          {item.workItemCode}
                        </code>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">No active work items cataloged.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/40 border rounded-lg">
              <Switch 
                id="roomActive" 
                checked={formData.active} 
                onCheckedChange={(val) => handleInputChange("active", val)}
              />
              <div>
                <Label htmlFor="roomActive" className="text-sm font-semibold">Active Status</Label>
                <p className="text-[10px] text-muted-foreground">Inactive templates cannot be assigned on new visits.</p>
              </div>
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
                  {isSaving ? "Saving..." : selectedRoom ? "Save Specifications" : "Create Configuration"}
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

      {/* Delete Confirmation Modal for Subcategory */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Room Type"
        description={`Are you sure you want to delete "${selectedRoom?.roomTypeName}"? This cannot be undone.`}
      />

      {/* Delete Confirmation Modal for Parent Master */}
      <DeleteConfirmationModal
        isOpen={isParentDeleteModalOpen}
        onClose={() => setIsParentDeleteModalOpen(false)}
        onConfirm={handleConfirmParentDelete}
        title="Delete Master Category"
        description={`Are you sure you want to delete the master category "${selectedParentMaster?.masterName || selectedParentMaster?.name}"? All subcategory rooms linked to it must be empty or unlinked.`}
      />
    </ConfigurationLayout>
  );
}
