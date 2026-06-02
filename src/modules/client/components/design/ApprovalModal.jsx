import { CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ApprovalModal({ open, onClose, onConfirm, design }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            Approve Design
          </DialogTitle>
          <DialogDescription>
            You are about to approve this design. This action cannot be undone and will notify the design team to proceed.
          </DialogDescription>
        </DialogHeader>

        {design && (
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="flex gap-3 items-center">
              <img
                src={design.thumbnail}
                alt=""
                className="h-14 w-20 rounded-md object-cover shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <p className="font-medium text-sm">{design.projectName}</p>
                <p className="text-xs text-muted-foreground">{design.designType}</p>
                <p className="text-xs font-mono text-primary mt-0.5">{design.version}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          By approving, you confirm the design meets your requirements and the team can proceed to construction documentation.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={onConfirm}>
            <CheckCircle2 className="h-4 w-4" />
            Yes, Approve Design
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
