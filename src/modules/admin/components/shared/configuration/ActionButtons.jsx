import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActionButtons({ onEdit, onDelete, editLabel = "Edit", deleteLabel = "Delete" }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={onEdit} title={editLabel} className="h-8 w-8 text-muted-foreground hover:text-primary">
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title={deleteLabel} className="h-8 w-8 text-muted-foreground hover:text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
