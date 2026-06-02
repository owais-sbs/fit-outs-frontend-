import { useState, useRef } from "react";
import { RotateCcw, X, ImageIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export default function RevisionModal({ open, onClose, onSubmit, design }) {
  const [feedback, setFeedback] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [refImages, setRefImages] = useState([]);
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const newFiles = [...e.target.files].map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      name: f.name,
    }));
    setRefImages((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (idx) => setRefImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    onSubmit({ feedback, priority, refImages: refImages.map(r => r.preview) });
    setFeedback("");
    setPriority("Medium");
    setRefImages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
              <RotateCcw className="h-5 w-5 text-amber-500" />
            </div>
            Request Changes
          </DialogTitle>
          <DialogDescription>
            Describe the changes you'd like to see. The design team will review and address your feedback.
          </DialogDescription>
        </DialogHeader>

        {design && (
          <div className="rounded-lg bg-muted/40 p-3 flex gap-3 items-center">
            <img
              src={design.thumbnail}
              alt=""
              className="h-12 w-16 rounded-md object-cover shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div>
              <p className="font-medium text-sm">{design.projectName}</p>
              <p className="text-xs text-muted-foreground">{design.designType} · {design.version}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Feedback textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Revision Notes <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Describe what changes you'd like — e.g. 'Please change the marble finish in the master bathroom to a lighter travertine. The wardrobe doors need to swing outward instead of sliding.'"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground">{feedback.length} characters</p>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Reference images */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Images (optional)</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/20 transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              Upload reference images
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            {refImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {refImages.map((img, idx) => (
                  <div key={idx} className="group relative">
                    <img src={img.preview} alt="" className="h-16 w-full rounded-md object-cover border border-border/40" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="gap-2"
            onClick={handleSubmit}
            disabled={!feedback.trim()}
          >
            <RotateCcw className="h-4 w-4" />
            Submit Revision Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
