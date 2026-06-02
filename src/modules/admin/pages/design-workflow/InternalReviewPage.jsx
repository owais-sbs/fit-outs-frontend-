import { useState } from "react";
import { CheckCircle2, Circle, ThumbsUp, RotateCcw, ChevronRight, Calendar } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { INTERNAL_REVIEW_ITEMS } from "../../data/design-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const STATUS_VARIANT = {
  "Under Review": "warning",
  "Approved": "success",
  "Sent Back": "destructive",
};

// Checklist labels relevant to interior design / fit-out
const CHECKLIST_LABELS = {
  branding: "Brand & Identity Alignment",
  typography: "Material & Finish Schedule",
  spacing: "Spatial Planning & Dimensions",
  responsiveness: "FF&E Coordination",
  accessibility: "Accessibility & Compliance",
};

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function ChecklistItem({ label, checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors w-full ${
        checked
          ? "border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
      }`}
    >
      {checked
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        : <Circle className="h-4 w-4 shrink-0" />
      }
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function InternalReviewPage() {
  const [items, setItems] = useState(INTERNAL_REVIEW_ITEMS);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const openDetail = (item) => {
    setActiveItem({ ...item });
    setDetailOpen(true);
  };

  const toggleCheck = (key) => {
    setActiveItem((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] },
    }));
  };

  const passedCount = (checklist) => Object.values(checklist).filter(Boolean).length;
  const totalCount = (checklist) => Object.keys(checklist).length;

  const handleApprove = () => {
    setItems((prev) => prev.map((i) => i.id === activeItem.id ? { ...activeItem, status: "Approved" } : i));
    setDetailOpen(false);
  };

  const handleSendBack = () => {
    setItems((prev) => prev.map((i) => i.id === activeItem.id ? { ...activeItem, status: "Sent Back" } : i));
    setDetailOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Review"
        description="Quality-check interior design concepts against brand alignment, materials, spatial planning, FF&E, and compliance."
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Under Review", count: items.filter(i => i.status === "Under Review").length, color: "text-amber-600" },
          { label: "Approved", count: items.filter(i => i.status === "Approved").length, color: "text-emerald-600" },
          { label: "Sent Back", count: items.filter(i => i.status === "Sent Back").length, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const passed = passedCount(item.checklist);
          const total = totalCount(item.checklist);
          return (
            <Card key={item.id} className="overflow-hidden border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
              {/* Interior design preview */}
              <div className="relative h-48 bg-muted overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.projectName}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{item.projectName}</p>
                    <p className="text-xs text-white/70">{item.clientName}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[item.status]} className="shrink-0">{item.status}</Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary shrink-0">
                      {item.designerAvatar}
                    </div>
                    <span>{item.designer}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.reviewDate)}
                  </div>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono font-semibold">{item.version}</span>
                </div>

                {/* Checklist progress */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium">Review Checklist</p>
                    <p className="text-xs text-muted-foreground">{passed}/{total} items</p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={`h-full rounded-full transition-all ${passed === total ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${(passed / total) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(item.checklist).map(([key, val]) => (
                      <span key={key} className={`text-[10px] rounded px-1.5 py-0.5 font-medium ${val ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        {CHECKLIST_LABELS[key].split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 h-8 text-sm" onClick={() => openDetail(item)}>
                  Open Review Panel
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Design Review — {activeItem?.projectName}</DialogTitle>
          </DialogHeader>
          {activeItem && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg bg-muted/40 p-3">
                <img
                  src={activeItem.thumbnail}
                  alt=""
                  className="h-20 w-28 rounded-md object-cover shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div>
                  <p className="font-medium">{activeItem.projectName}</p>
                  <p className="text-sm text-muted-foreground">{activeItem.clientName}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant={STATUS_VARIANT[activeItem.status]}>{activeItem.status}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{activeItem.version}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium">Quality Checklist</p>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(activeItem.checklist).map(([key, val]) => (
                    <ChecklistItem
                      key={key}
                      label={CHECKLIST_LABELS[key]}
                      checked={val}
                      onChange={() => toggleCheck(key)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleSendBack}
            >
              <RotateCcw className="h-4 w-4" />
              Send Back for Revision
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
              <ThumbsUp className="h-4 w-4" />
              Approve & Forward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
