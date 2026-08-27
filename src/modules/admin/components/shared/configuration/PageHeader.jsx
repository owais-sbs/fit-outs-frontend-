import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/layout/PageShell";

export default function PageHeader({ title, description, actionLabel, onAction }) {
  return (
    <PageTitle
      title={title}
      subtitle={description}
      actions={
        actionLabel ? (
          <Button onClick={onAction}>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        ) : null
      }
    />
  );
}
