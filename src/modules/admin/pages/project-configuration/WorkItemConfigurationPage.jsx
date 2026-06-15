import React, { useState } from "react";
import { Wrench } from "lucide-react";
import ConfigurationLayout from "../../components/shared/configuration/ConfigurationLayout";
import PageHeader from "../../components/shared/configuration/PageHeader";
import MasterTable from "../../components/shared/configuration/MasterTable";
import ActionButtons from "../../components/shared/configuration/ActionButtons";
import MasterFormModal from "../../components/shared/configuration/MasterFormModal";
import DeleteConfirmationModal from "../../components/shared/configuration/DeleteConfirmationModal";
import EmptyState from "../../components/shared/configuration/EmptyState";
import { TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

// Dummy data for Work Item Configuration
const initialCategories = [];

const unitTypes = ["Sq Ft", "Sq Mtr", "Running Ft", "Nos", "Unit", "Lumpsum", "Kg", "Meter"];

export default function WorkItemConfigurationPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemParentCategoryId, setItemParentCategoryId] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [itemForm, setItemForm] = useState({ 
    categoryId: "", 
    name: "", 
    unit: "", 
    sellingPrice: "", 
    subcontractorPrice: "", 
    description: "" 
  });

  const columns = [
    { label: "Category", className: "w-[250px]" },
    { label: "Total Items", className: "" },
    { label: "Actions", className: "w-[150px] text-right" }
  ];

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryForm({ name: category.name, description: category.description || "" });
    } else {
      setSelectedCategory(null);
      setCategoryForm({ name: "", description: "" });
    }
    setIsCategoryModalOpen(true);
  };

  const handleOpenItemModal = (item = null, parentCategoryId = null) => {
    if (item && parentCategoryId) {
      setSelectedItem(item);
      setItemParentCategoryId(parentCategoryId);
      setItemForm({
        categoryId: parentCategoryId,
        name: item.name,
        unit: item.unit,
        sellingPrice: item.sellingPrice,
        subcontractorPrice: item.subcontractorPrice,
        description: item.description || ""
      });
    } else {
      setSelectedItem(null);
      setItemParentCategoryId(null);
      setItemForm({ categoryId: parentCategoryId || (categories.length > 0 ? categories[0].id : ""), name: "", unit: "", sellingPrice: "", subcontractorPrice: "", description: "" });
    }
    setIsItemModalOpen(true);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (selectedCategory) {
      setCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, name: categoryForm.name, description: categoryForm.description } : c));
    } else {
      setCategories(prev => [...prev, { id: Date.now().toString(), name: categoryForm.name, description: categoryForm.description, children: [] }]);
    }
    setIsCategoryModalOpen(false);
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    if (selectedItem) {
      setCategories(prev => prev.map(c => {
        if (c.id === itemParentCategoryId && itemParentCategoryId !== itemForm.categoryId) {
          return { ...c, children: c.children.filter(child => child.id !== selectedItem.id) };
        }
        if (c.id === itemForm.categoryId && itemParentCategoryId !== itemForm.categoryId) {
          return { ...c, children: [...c.children, { ...selectedItem, name: itemForm.name, unit: itemForm.unit, sellingPrice: parseFloat(itemForm.sellingPrice), subcontractorPrice: parseFloat(itemForm.subcontractorPrice), description: itemForm.description }] };
        }
        if (c.id === itemForm.categoryId && itemParentCategoryId === itemForm.categoryId) {
          return { ...c, children: c.children.map(child => child.id === selectedItem.id ? { ...child, name: itemForm.name, unit: itemForm.unit, sellingPrice: parseFloat(itemForm.sellingPrice), subcontractorPrice: parseFloat(itemForm.subcontractorPrice), description: itemForm.description } : child) };
        }
        return c;
      }));
    } else {
      setCategories(prev => prev.map(c => c.id === itemForm.categoryId ? {
        ...c,
        children: [...c.children, { id: Date.now().toString(), name: itemForm.name, unit: itemForm.unit, sellingPrice: parseFloat(itemForm.sellingPrice), subcontractorPrice: parseFloat(itemForm.subcontractorPrice), description: itemForm.description }]
      } : c));
    }
    setIsItemModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedItem && itemParentCategoryId) {
      setCategories(prev => prev.map(c => c.id === itemParentCategoryId ? { ...c, children: c.children.filter(child => child.id !== selectedItem.id) } : c));
    } else if (selectedCategory) {
      setCategories(prev => prev.filter(c => c.id !== selectedCategory.id));
    }
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
    setSelectedItem(null);
    setItemParentCategoryId(null);
  };



  return (
    <ConfigurationLayout>
      <div className="flex flex-col gap-6 h-full">
        <PageHeader 
          title="Work Item Configuration" 
          description="The administrator defines all work categories, work items and their pricing."
          actionLabel="Add Work Category" 
          onAction={() => handleOpenCategoryModal()} 
        />
        
        <Card className="flex-1 shadow-sm">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex-1">
                {categories.length > 0 ? (
                  <MasterTable
                    columns={columns}
                    data={categories}
                    expandable={true}
                    renderRow={(row) => (
                      <>
                        <TableCell className="font-medium text-base">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">{row.children.length} items</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenItemModal(null, row.id); }}>
                              <Plus className="w-3 h-3 mr-1" /> Add Item
                            </Button>
                            <ActionButtons
                              onEdit={(e) => { e.stopPropagation(); handleOpenCategoryModal(row); }}
                              onDelete={(e) => { e.stopPropagation(); setSelectedCategory(row); setIsDeleteModalOpen(true); }}
                            />
                          </div>
                        </TableCell>
                      </>
                    )}
                    renderExpandedRow={(children, parentRow) => (
                      <div className="bg-background rounded-md border shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                              <th className="py-2 px-4 text-left font-medium">Work Item</th>
                              <th className="py-2 px-4 text-left font-medium">Unit Type</th>
                              <th className="py-2 px-4 text-left font-medium">Selling Price</th>
                              <th className="py-2 px-4 text-left font-medium">Subcontractor Price</th>
                              <th className="py-2 px-4 text-right font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {children.length > 0 ? children.map(child => (
                              <tr key={child.id} className="border-t hover:bg-muted/20">
                                <td className="py-2 px-4 font-medium">{child.name}</td>
                                <td className="py-2 px-4">{child.unit}</td>
                                <td className="py-2 px-4 text-emerald-600">₹{child.sellingPrice}</td>
                                <td className="py-2 px-4 text-amber-600">₹{child.subcontractorPrice}</td>
                                <td className="py-2 px-4 text-right">
                                  <ActionButtons
                                    onEdit={(e) => { e.stopPropagation(); handleOpenItemModal(child, parentRow.id); }}
                                    onDelete={(e) => { e.stopPropagation(); setSelectedItem(child); setItemParentCategoryId(parentRow.id); setIsDeleteModalOpen(true); }}
                                  />
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="5" className="py-4 text-center text-muted-foreground">No work items found in this category.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  />
                ) : (
                  <EmptyState 
                    title="No Work Categories"
                    description="Get started by creating your first work category."
                    actionLabel="Add Work Category"
                    onAction={() => handleOpenCategoryModal()}
                  />
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Modal */}
      <MasterFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedCategory ? "Edit Work Category" : "Add Work Category"}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input 
              id="categoryName" 
              required 
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryDesc">Description</Label>
            <Textarea 
              id="categoryDesc" 
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </MasterFormModal>

      {/* Work Item Modal */}
      <MasterFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={selectedItem ? "Edit Work Item" : "Add Work Item"}
      >
        <form onSubmit={handleItemSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Work Category *</Label>
            <Select required value={itemForm.categoryId} onValueChange={(val) => setItemForm({...itemForm, categoryId: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemName">Work Item Name *</Label>
            <Input 
              id="itemName" 
              required 
              value={itemForm.name}
              onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit Type *</Label>
              <Select required value={itemForm.unit} onValueChange={(val) => setItemForm({...itemForm, unit: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price *</Label>
              <Input 
                id="sellingPrice" 
                type="number" 
                min="0" 
                step="0.01" 
                required 
                value={itemForm.sellingPrice}
                onChange={(e) => setItemForm({...itemForm, sellingPrice: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcontractorPrice">Subcontractor Price *</Label>
              <Input 
                id="subcontractorPrice" 
                type="number" 
                min="0" 
                step="0.01" 
                required 
                value={itemForm.subcontractorPrice}
                onChange={(e) => setItemForm({...itemForm, subcontractorPrice: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemDesc">Description</Label>
            <Textarea 
              id="itemDesc" 
              value={itemForm.description}
              onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Item</Button>
          </div>
        </form>
      </MasterFormModal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={selectedItem ? "Delete Work Item" : "Delete Work Category"}
        description={`Are you sure you want to delete this ${selectedItem ? "work item" : "work category"}? This action cannot be undone.`}
      />
    </ConfigurationLayout>
  );
}
