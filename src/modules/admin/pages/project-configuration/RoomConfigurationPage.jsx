import React, { useState } from "react";
import { Grid } from "lucide-react";
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

// Dummy data for Room Configuration
const initialRooms = [];

export default function RoomConfigurationPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    childTypes: [{ id: Date.now().toString(), name: "" }]
  });

  const columns = [
    { label: "Parent Category", className: "w-[250px]" },
    { label: "Room Types", className: "" },
    { label: "Actions", className: "w-[100px] text-right" }
  ];

  const handleOpenModal = (room = null) => {
    if (room) {
      setSelectedRoom(room);
      setFormData({
        name: room.name,
        description: room.description || "",
        childTypes: room.children.length > 0 ? [...room.children] : [{ id: Date.now().toString(), name: "" }]
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        name: "",
        description: "",
        childTypes: [{ id: Date.now().toString(), name: "" }]
      });
    }
    setIsModalOpen(true);
  };

  const handleAddChildType = () => {
    setFormData(prev => ({
      ...prev,
      childTypes: [...prev.childTypes, { id: Date.now().toString(), name: "" }]
    }));
  };

  const handleRemoveChildType = (id) => {
    setFormData(prev => ({
      ...prev,
      childTypes: prev.childTypes.filter(child => child.id !== id)
    }));
  };

  const handleChildTypeChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      childTypes: prev.childTypes.map(child => child.id === id ? { ...child, name: value } : child)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validChildren = formData.childTypes.filter(c => c.name.trim() !== "");
    
    if (selectedRoom) {
      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? {
        ...r,
        name: formData.name,
        description: formData.description,
        children: validChildren
      } : r));
    } else {
      setRooms(prev => [...prev, {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        children: validChildren
      }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedRoom) {
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      setIsDeleteModalOpen(false);
      setSelectedRoom(null);
    }
  };



  return (
    <ConfigurationLayout>
      <div className="flex flex-col gap-6 h-full">
        <PageHeader 
          title="Room Configuration" 
          description="The administrator defines the room structure using a Parent → Child hierarchy."
          actionLabel="Add Room Category" 
          onAction={() => handleOpenModal()} 
        />
        
        <Card className="flex-1 shadow-sm">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex-1">
                {rooms.length > 0 ? (
                  <MasterTable
                    columns={columns}
                    data={rooms}
                    expandable={true}
                    renderRow={(row) => (
                      <>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[300px]">
                          {row.children.map(c => c.name).join(", ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionButtons
                            onEdit={(e) => { e.stopPropagation(); handleOpenModal(row); }}
                            onDelete={(e) => { e.stopPropagation(); setSelectedRoom(row); setIsDeleteModalOpen(true); }}
                          />
                        </TableCell>
                      </>
                    )}
                    renderExpandedRow={(children) => (
                      <div className="flex flex-wrap gap-2">
                        {children.map(child => (
                          <div key={child.id} className="bg-background border rounded-md px-3 py-1.5 text-sm shadow-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                            {child.name}
                          </div>
                        ))}
                      </div>
                    )}
                  />
                ) : (
                  <EmptyState 
                    title="No Room Categories"
                    description="Get started by creating your first room category."
                    actionLabel="Add Room Category"
                    onAction={() => handleOpenModal()}
                  />
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      <MasterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoom ? "Edit Room Category" : "Add Room Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Parent Category Name *</Label>
            <Input 
              id="name" 
              required 
              placeholder="e.g. Room, Kitchen, Balcony" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Optional description" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="pt-2 border-t mt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Dynamic Child Room Types *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddChildType}>
                + Add More
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 pb-2">
              {formData.childTypes.map((child, index) => (
                <div key={child.id} className="flex items-center gap-2">
                  <div className="w-8 flex justify-center text-sm text-muted-foreground">{index + 1}.</div>
                  <Input 
                    required 
                    placeholder={`Room Type ${index + 1}`} 
                    value={child.name}
                    onChange={(e) => handleChildTypeChange(child.id, e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveChildType(child.id)}
                    disabled={formData.childTypes.length === 1}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Category</Button>
          </div>
        </form>
      </MasterFormModal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Room Category"
        description="Are you sure you want to delete this room category? This action cannot be undone."
      />
    </ConfigurationLayout>
  );
}
