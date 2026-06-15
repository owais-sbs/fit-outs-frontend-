import React from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon = FileQuestion, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed bg-muted/10 h-64">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-4">{description}</p>
      {actionLabel && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
