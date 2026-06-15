import React, { useState, useEffect } from "react";
import { 
  Grid, Search, Eye, Filter, Check, X, Layout, 
  Layers, Square, Trash2, Play, Power, 
  ChevronRight, ChevronLeft, AlertCircle, CheckSquare
} from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  fetchRoomTypes, 
  createRoomType, 
  updateRoomType, 
  deleteRoomType, 
  activateRoomType, 
  deactivateRoomType 
} from "../../api/room-type.api";

import { fetchWorkItems } from "../../api/work-item.api";

// Room Categories matching backend RoomCategory enum
const ROOM_CATEGORIES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "EDUCATION", label: "Education" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "RETAIL", label: "Retail" },
  { value: "OFFICE", label: "Office Space" },
  { value: "COMMON_AREA", label: "Common Area" },
  { value: "OTHER", label: "Other" }
];

export default function RoomConfigurationPage() {
  const [rooms, setRooms] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  
  // Modals & Panels state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Table Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "RESIDENTIAL",
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

  // Load rooms and work items
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const filterBody = {
        search: searchTerm.trim() !== "" ? searchTerm : null,
        category: categoryFilter === "All" ? null : categoryFilter,
        active: statusFilter === "All" ? null : (statusFilter === "Active")
      };

      const result = await fetchRoomTypes(filterBody, currentPage - 1, itemsPerPage);
      setRooms(result.content || []);
      setTotalItems(result.totalElements || 0);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error("Error loading room types", e);
      triggerToast("error", "Fetch Failed", "Could not retrieve room configurations from backend endpoints.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllWorkItems = async () => {
    try {
      // Fetch all active work items (pagination size 1000 to get a full bindable scope list)
      const res = await fetchWorkItems({ active: true }, 0, 1000);
      setWorkItems(res.content || []);
    } catch (e) {
      console.error("Error loading work items catalog", e);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadAllWorkItems();
  }, []);

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

  // Bulk Operations
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRowIds(new Set(rooms.map(r => r.id)));
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
          await activateRoomType(id);
        } else {
          await deactivateRoomType(id);
        }
      }
      triggerToast("success", "Status Updated", `Bulk updated status of selected templates.`);
      setSelectedRowIds(new Set());
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Bulk Update Failed", "Failed to update templates status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    setIsLoading(true);
    try {
      for (const id of selectedRowIds) {
        await deleteRoomType(id);
      }
      triggerToast("success", "Templates Deleted", `Deleted selected room templates.`);
      setSelectedRowIds(new Set());
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Bulk Deletion Failed", "Failed to delete templates.");
    } finally {
      setIsLoading(false);
    }
  };

  // Form Management
  const handleOpenModal = (room = null) => {
    setFormErrors({});
    if (room) {
      setSelectedRoom(room);
      const itemIds = room.workItems ? Array.from(room.workItems).map(item => item.id) : [];
      setFormData({
        name: room.roomTypeName,
        code: room.roomCode,
        category: room.category || "RESIDENTIAL",
        description: room.description || "",
        active: room.active ?? true,
        ceilingRequired: room.ceilingMeasurementRequired ?? false,
        wallRequired: room.wallMeasurementRequired ?? false,
        floorRequired: room.floorMeasurementRequired ?? false,
        defaultWorkItemIds: itemIds
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        name: "",
        code: "",
        category: "RESIDENTIAL",
        description: "",
        active: true,
        ceilingRequired: true,
        wallRequired: true,
        floorRequired: true,
        defaultWorkItemIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (room) => {
    setSelectedRoom(room);
    setIsViewModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      
      // Auto-generate code from name for new entries if code hasn't been manually set
      if (field === "name" && !selectedRoom && (!prev.code || prev.code === `RM-${prev.name.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`)) {
        const generatedCode = `RM-${value.replace(/\s+/g, "").substring(0, 8).toUpperCase()}`;
        next.code = generatedCode;
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

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Room name is required.";
    else if (formData.name.length < 3) errors.name = "Room name must be at least 3 characters.";
    
    const codeRegex = /^RM-[A-Z0-9-]{2,20}$/;
    if (!formData.code.trim()) errors.code = "Room code is required.";
    else if (!codeRegex.test(formData.code)) {
      errors.code = "Code must begin with 'RM-' followed by uppercase letters, numbers, or dashes.";
    }

    if (!formData.ceilingRequired && !formData.wallRequired && !formData.floorRequired) {
      errors.applicability = "Please select at least one applicable measurement surface.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      triggerToast("error", "Validation Failed", "Please correct the highlighted errors in the form.");
      return;
    }

    setIsSaving(true);
    const payload = {
      roomTypeName: formData.name.trim(),
      roomCode: formData.code.trim().toUpperCase(),
      category: formData.category,
      description: formData.description.trim(),
      ceilingMeasurementRequired: formData.ceilingRequired,
      wallMeasurementRequired: formData.wallRequired,
      floorMeasurementRequired: formData.floorRequired,
      workItemIds: formData.defaultWorkItemIds
    };

    try {
      if (selectedRoom) {
        await updateRoomType(selectedRoom.id, payload);
        triggerToast("success", "Room Type Updated", `Room template "${payload.roomTypeName}" updated successfully.`);
      } else {
        await createRoomType(payload);
        triggerToast("success", "Room Type Created", `Room template "${payload.roomTypeName}" created successfully.`);
      }
      setIsModalOpen(false);
      loadRooms();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Endpoint error occurred.";
      triggerToast("error", "Failed to Save Room Type", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    try {
      await deleteRoomType(selectedRoom.id);
      triggerToast("success", "Template Deleted", `Room template "${selectedRoom.roomTypeName}" has been permanently deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedRoom(null);
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Deletion Failed", "Failed to delete room configuration template.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (room) => {
    setIsLoading(true);
    try {
      if (room.active) {
        await deactivateRoomType(room.id);
        triggerToast("success", "Room Deactivated", `Template "${room.roomTypeName}" deactivated.`);
      } else {
        await activateRoomType(room.id);
        triggerToast("success", "Room Activated", `Template "${room.roomTypeName}" activated.`);
      }
      loadRooms();
    } catch (e) {
      console.error(e);
      triggerToast("error", "Toggle Failed", "Error updating status.");
    } finally {
      setIsLoading(false);
    }
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

        <PageHeader 
          title="Room Type Master" 
          description="Design standard room templates defining measurement rules and baseline work scopes."
          actionLabel="Create Room Type" 
          onAction={() => handleOpenModal()} 
        />

        {/* Dashboard Statistics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 shadow-sm border border-muted/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Room Profiles</p>
                <h3 className="text-xl font-bold">{totalItems}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 shadow-sm border border-muted/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Linked Work Items</p>
                <h3 className="text-xl font-bold">{workItems.length} active</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 shadow-sm border border-muted/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Configured Category filters</p>
                <h3 className="text-sm font-bold text-muted-foreground">
                  {ROOM_CATEGORIES.length} options
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 shadow-sm border border-muted/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">UOM units mapped</p>
                <h3 className="text-xl font-bold">10 types</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 border rounded-lg shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by room name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Category:</span>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] text-xs h-[32px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {ROOM_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        {/* Master Table Grid */}
        <Card className="shadow-sm border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 items-center py-2 border-b">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/12" />
                    <Skeleton className="h-6 w-1/6" />
                    <Skeleton className="h-6 w-1/12" />
                    <Skeleton className="h-6 w-[120px] ml-auto" />
                  </div>
                ))}
              </div>
            ) : rooms.length > 0 ? (
              <div>
                <MasterTable
                  columns={[
                    { label: (
                      <Checkbox 
                        checked={selectedRowIds.size === rooms.length && rooms.length > 0} 
                        onCheckedChange={(checked) => handleSelectAll(checked)} 
                      />
                    ), className: "w-[40px]" },
                    { label: "Room Type Name" },
                    { label: "Code" },
                    { label: "Category" },
                    { label: "Measurement Applicability" },
                    { label: "Default Scope", className: "text-center" },
                    { label: "Status" },
                    { label: "Audit Timeline" },
                    { label: "Actions", className: "w-[120px] text-right" }
                  ]}
                  data={rooms}
                  expandable={true}
                  renderRow={(row) => {
                    const categoryLabel = ROOM_CATEGORIES.find(c => c.value === row.category)?.label || row.category;
                    const itemsCount = row.workItems ? row.workItems.length : 0;
                    return (
                      <>
                        <TableCell>
                          <Checkbox 
                            checked={selectedRowIds.has(row.id)} 
                            onCheckedChange={(checked) => handleSelectRow(row.id, checked)} 
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground flex items-center gap-2">
                          <span>{row.roomTypeName}</span>
                          {!row.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal">Archived</span>}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono font-semibold px-2 py-0.5 bg-muted border rounded text-muted-foreground">
                            {row.roomCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                            row.category === "RESIDENTIAL" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            row.category === "COMMERCIAL" ? "bg-purple-50 text-purple-700 border-purple-200" :
                            row.category === "RETAIL" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            row.category === "HOSPITALITY" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-slate-50 text-slate-700 border-slate-200"
                          }`}>
                            {categoryLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className={`px-1.5 py-0.5 rounded ${row.ceilingMeasurementRequired ? "bg-slate-100 text-slate-800 font-bold" : "text-muted-foreground/40 line-through"}`}>C</span>
                            <span className={`px-1.5 py-0.5 rounded ${row.wallMeasurementRequired ? "bg-slate-100 text-slate-800 font-bold" : "text-muted-foreground/40 line-through"}`}>W</span>
                            <span className={`px-1.5 py-0.5 rounded ${row.floorMeasurementRequired ? "bg-slate-100 text-slate-800 font-bold" : "text-muted-foreground/40 line-through"}`}>F</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted border text-muted-foreground">
                            {itemsCount} {itemsCount === 1 ? "item" : "items"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Switch 
                              checked={row.active} 
                              onCheckedChange={() => handleToggleActive(row)} 
                            />
                            <StatusBadge status={row.active} />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span>System Admin</span>
                            <span className="text-[10px] opacity-75">
                              {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "2026-06-15"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenViewModal(row)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <ActionButtons
                              onEdit={() => handleOpenModal(row)}
                              onDelete={() => handleDeleteClick(row)}
                            />
                          </div>
                        </TableCell>
                      </>
                    );
                  }}
                  renderExpandedRow={(children, parentRow) => (
                      <div className="space-y-3">
                        <div className="flex flex-col md:flex-row items-start gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Room Specifications</p>
                            <p className="text-sm text-foreground mb-3">{parentRow.description || "No description provided for this template profile."}</p>
                            
                            <div className="grid grid-cols-3 gap-4 border-t pt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Ceiling Required</p>
                                <span className="text-xs font-semibold">{parentRow.ceilingMeasurementRequired ? "Yes" : "No"}</span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Wall Required</p>
                                <span className="text-xs font-semibold">{parentRow.wallMeasurementRequired ? "Yes" : "No"}</span>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Floor Required</p>
                                <span className="text-xs font-semibold">{parentRow.floorMeasurementRequired ? "Yes" : "No"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-[350px] bg-muted/30 border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 border-b pb-1">Default Scope of Work</p>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {parentRow.workItems && parentRow.workItems.length > 0 ? (
                                parentRow.workItems.map(item => (
                                  <div key={item.id} className="flex justify-between items-center text-xs p-1 bg-background border rounded">
                                    <span className="truncate max-w-[200px] font-medium text-foreground">{item.workItemName}</span>
                                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold font-mono">{item.workItemCode}</code>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground italic text-center py-4">No associated default work scope.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between p-4 border-t bg-card text-xs text-muted-foreground">
                    <div>
                      Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} room templates
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
                      <div className="flex items-center gap-1 font-medium">
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
                  title={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? "No Matching Results" : "No Room Templates"}
                  description={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? "Try clearing search keywords or active status filters." : "Establish reusable room profiles specifying ceiling, wall, and flooring rules."}
                  actionLabel={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? "Reset Filters" : "Create Room Type"}
                  onAction={searchTerm || categoryFilter !== "All" || statusFilter !== "All" ? () => { setSearchTerm(""); setCategoryFilter("All"); setStatusFilter("All"); } : () => handleOpenModal()}
                />
              )}
          </CardContent>
        </Card>

        {/* Bulk Actions Sticky Bar */}
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

      {/* Create / Edit Drawer Modal */}
      <MasterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? `Edit Room Type: ${formData.code}` : "Create New Room Type"}
        className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
            
            {/* Left Side: General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-1 text-foreground">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Type Name *</Label>
                <Input 
                  id="roomName" 
                  required 
                  placeholder="e.g. Executive Cabin, Conference Room A" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code *</Label>
                  <Input 
                    id="roomCode" 
                    required 
                    placeholder="e.g. RM-CAB-01" 
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                    className={formErrors.code ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomCategory">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger id="roomCategory">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formErrors.code && (
                <p className="text-[11px] text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formErrors.code}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="roomDesc">Description</Label>
                <Textarea 
                  id="roomDesc" 
                  placeholder="Provide parameters about room dimensions, target requirements, or physical layout details." 
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/40 border rounded-lg">
                <Switch 
                  id="roomActive" 
                  checked={formData.active} 
                  onCheckedChange={(val) => handleInputChange("active", val)}
                />
                <div>
                  <Label htmlFor="roomActive" className="text-sm font-semibold">Active Status</Label>
                  <p className="text-[10px] text-muted-foreground">Inactive room templates cannot be assigned on site visits.</p>
                </div>
              </div>
            </div>

            {/* Right Side: Applicability & Bindings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-1 text-foreground">Applicability & Defaults</h3>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Measurement Applicability</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    onClick={() => handleInputChange("ceilingRequired", !formData.ceilingRequired)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.ceilingRequired 
                        ? "border-primary bg-primary/5 text-primary shadow-sm font-bold" 
                        : "bg-background border-muted hover:bg-muted/10 text-muted-foreground"
                    }`}
                  >
                    <Layers className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-semibold">Ceiling</span>
                  </div>
                  <div 
                    onClick={() => handleInputChange("wallRequired", !formData.wallRequired)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.wallRequired 
                        ? "border-primary bg-primary/5 text-primary shadow-sm font-bold" 
                        : "bg-background border-muted hover:bg-muted/10 text-muted-foreground"
                    }`}
                  >
                    <Square className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-semibold">Wall</span>
                  </div>
                  <div 
                    onClick={() => handleInputChange("floorRequired", !formData.floorRequired)}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.floorRequired 
                        ? "border-primary bg-primary/5 text-primary shadow-sm font-bold" 
                        : "bg-background border-muted hover:bg-muted/10 text-muted-foreground"
                    }`}
                  >
                    <Grid className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-semibold">Floor</span>
                  </div>
                </div>
                {formErrors.applicability && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.applicability}
                  </p>
                )}
              </div>

              {/* Work item binding checklist */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Default Scope items ({formData.defaultWorkItemIds.length} bound)
                </Label>
                <div className="border rounded-lg bg-background overflow-hidden">
                  <div className="p-2 border-b bg-muted/40">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input 
                        placeholder="Search work items..." 
                        className="pl-8 h-8 text-xs"
                        onChange={(e) => {
                          const query = e.target.value.toLowerCase();
                          const rows = document.querySelectorAll(".binding-item-row");
                          rows.forEach(row => {
                            if (row.textContent.toLowerCase().includes(query)) {
                              row.classList.remove("hidden");
                            } else {
                              row.classList.add("hidden");
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                    {workItems.length > 0 ? (
                      workItems.map(item => {
                        const isChecked = formData.defaultWorkItemIds.includes(item.id);
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => handleWorkItemToggle(item.id)}
                            className={`binding-item-row flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-muted/30 transition-colors ${
                              isChecked ? "border-primary/50 bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center transition-colors pointer-events-none ${
                                isChecked ? "bg-primary text-primary-foreground" : "bg-background"
                              }`}>
                                {isChecked && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-xs font-semibold text-foreground truncate max-w-[170px]">
                                {item.workItemName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-[9px] text-muted-foreground uppercase bg-muted border px-1.5 py-0.5 rounded font-mono">
                                {item.workItemCode}
                              </code>
                              <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-sm">
                                {item.unitType}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4 italic">No active work items cataloged. Create them in Work Item Master first.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : selectedRoom ? "Save Specifications" : "Create Template"}
            </Button>
          </div>
        </form>
      </MasterFormModal>

      {/* View Details Modal */}
      <MasterFormModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Room Type Template: ${selectedRoom?.roomTypeName}`}
        className="sm:max-w-[600px]"
      >
        {selectedRoom && (
          <div className="space-y-6 mt-4">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Template ID Code</p>
                <code className="text-sm font-mono font-bold bg-muted px-2.5 py-1 rounded text-primary border mt-1 block w-max">
                  {selectedRoom.roomCode}
                </code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold text-right">Scope Category</p>
                <span className="mt-1 block text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/25">
                  {ROOM_CATEGORIES.find(c => c.value === selectedRoom.category)?.label || selectedRoom.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Ceiling Calculation</p>
                <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${selectedRoom.ceilingMeasurementRequired ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {selectedRoom.ceilingMeasurementRequired ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Required
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Wall Calculation</p>
                <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${selectedRoom.wallMeasurementRequired ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {selectedRoom.wallMeasurementRequired ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Required
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Floor Calculation</p>
                <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${selectedRoom.floorMeasurementRequired ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {selectedRoom.floorMeasurementRequired ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Required
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Active Status</p>
                <StatusBadge status={selectedRoom.active} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</p>
              <p className="text-sm bg-muted/40 p-3 rounded-lg border text-muted-foreground leading-relaxed">
                {selectedRoom.description || "No description provided for this room template profile."}
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Bound Default Work Items ({selectedRoom.workItems?.length || 0})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {selectedRoom.workItems && selectedRoom.workItems.length > 0 ? (
                  selectedRoom.workItems.map(item => (
                    <div key={item.id} className="p-2 border rounded-md bg-card flex items-center justify-between gap-3 shadow-xs">
                      <div className="truncate">
                        <p className="text-xs font-semibold text-foreground truncate">{item.workItemName}</p>
                      </div>
                      <code className="text-[9px] font-mono bg-muted border px-1.5 py-0.5 rounded font-semibold text-muted-foreground shrink-0">{item.workItemCode}</code>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic col-span-2 text-center py-4 bg-muted/20 border rounded-lg">No associated default work items.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Dismiss
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenModal(selectedRoom);
                }}
              >
                Modify Specs
              </Button>
            </div>
          </div>
        )}
      </MasterFormModal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Room Type template"
        description={`Are you sure you want to delete the room configuration for "${selectedRoom?.roomTypeName}"? Surveyors won't be able to select it for new site rooms.`}
      />
    </ConfigurationLayout>
  );
}
