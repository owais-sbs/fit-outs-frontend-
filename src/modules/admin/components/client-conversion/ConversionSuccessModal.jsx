import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConversionSuccessModal({ open, onOpenChange, result, onViewProject, onViewClient, onGoToProjects }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Client Converted Successfully</DialogTitle>
            <DialogDescription className="text-center">
              Client converted successfully and moved to Projects.
            </DialogDescription>
          </div>
        </DialogHeader>
        {result && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center text-sm">
            <p className="text-muted-foreground">
              Project ID: <span className="font-mono font-medium text-foreground">{result.projectId}</span>
            </p>
            <p className="text-muted-foreground">
              Client ID: <span className="font-mono font-medium text-foreground">{result.clientId}</span>
            </p>
          </div>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={onViewClient}>
            View Client
          </Button>
          <Button variant="outline" className="flex-1" onClick={onViewProject}>
            View Project
          </Button>
          <Button className="flex-1" onClick={onGoToProjects}>
            Go to Projects
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
