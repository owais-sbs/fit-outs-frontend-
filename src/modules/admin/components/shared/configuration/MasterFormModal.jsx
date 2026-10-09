import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function MasterFormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "sm:max-w-lg",
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,42rem)] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0",
          className
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12 text-left">
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
