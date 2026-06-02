import { useState } from "react";
import { Calendar, Send, RefreshCw, GripVertical } from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { IN_PROGRESS_DESIGNS, KANBAN_COLUMNS } from "../../data/design-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(d));
}

const COLUMN_STYLE = {
  "Not Started": {
    header: "text-muted-foreground",
    border: "border-border/40",
    bg: "bg-muted/20",
    dot: "bg-muted-foreground",
  },
  "Working": {
    header: "text-primary",
    border: "border-primary/30",
    bg: "bg-primary/5",
    dot: "bg-primary",
  },
  "Ready For Review": {
    header: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-500",
  },
};

function ProgressBar({ value }) {
  const color =
    value >= 80 ? "bg-emerald-500" :
    value >= 50 ? "bg-primary" :
    value >= 25 ? "bg-amber-500" : "bg-muted-foreground/40";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function KanbanCard({ card, onUpdateProgress, onSendForReview }) {
  const deadlinePassed = new Date(card.deadline) < new Date();
  return (
    <div className="group relative rounded-xl border border-border/60 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md overflow-hidden">
      {/* Drag handle */}
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Interior design thumbnail */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={card.thumbnail}
          alt={card.projectName}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.parentElement.style.background = "hsl(var(--muted))"; e.target.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Tags on image */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Project info */}
        <div>
          <h3 className="font-semibold leading-snug">{card.projectName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{card.clientName}</p>
        </div>

        {/* Designer + Deadline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary shrink-0">
              {card.designerAvatar}
            </div>
            <span className="text-xs font-medium">{card.designer}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${deadlinePassed ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3 w-3" />
            {formatDate(card.deadline)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Design Progress</span>
            <span className="font-semibold">{card.progress}%</span>
          </div>
          <ProgressBar value={card.progress} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => onUpdateProgress(card)}
          >
            <RefreshCw className="h-3 w-3" />
            Update
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => onSendForReview(card)}
          >
            <Send className="h-3 w-3" />
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InProgressPage() {
  const [cards, setCards] = useState(IN_PROGRESS_DESIGNS);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [newProgress, setNewProgress] = useState(0);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const byColumn = (col) => cards.filter((c) => c.column === col);

  const openUpdate = (card) => {
    setActiveCard(card);
    setNewProgress(card.progress);
    setUpdateDialog(true);
  };

  const openReview = (card) => {
    setActiveCard(card);
    setReviewDialog(true);
  };

  const handleUpdateProgress = () => {
    setCards((prev) => prev.map((c) => c.id === activeCard.id ? { ...c, progress: newProgress } : c));
    setUpdateDialog(false);
  };

  const handleSendForReview = () => {
    setCards((prev) => prev.map((c) => c.id === activeCard.id ? { ...c, column: "Ready For Review" } : c));
    setReviewDialog(false);
  };

  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, col) => {
    e.preventDefault();
    if (draggingId) {
      setCards((prev) => prev.map((c) => c.id === draggingId ? { ...c, column: col } : c));
    }
    setDragOverCol(null);
    setDraggingId(null);
  };

  const totalProgress = cards.length
    ? Math.round(cards.reduce((sum, c) => sum + c.progress, 0) / cards.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="In Progress"
        description="Kanban board for active fit-out designs. Drag cards between columns to update stage."
      />

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {KANBAN_COLUMNS.map((col) => {
          const style = COLUMN_STYLE[col];
          return (
            <div key={col} className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${style.border} ${style.bg}`}>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              <span className={`text-sm font-medium ${style.header}`}>{col}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-xs font-bold">
                {byColumn(col).length}
              </span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
          <span className="text-xs text-muted-foreground">Avg. Progress</span>
          <span className="text-sm font-bold text-primary">{totalProgress}%</span>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KANBAN_COLUMNS.map((col) => {
          const style = COLUMN_STYLE[col];
          return (
            <div
              key={col}
              className={`rounded-xl border-2 border-dashed p-3 space-y-3 min-h-[400px] transition-all ${
                dragOverCol === col
                  ? "border-primary/60 bg-primary/5 scale-[1.01]"
                  : `${style.border} ${style.bg}`
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col)}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-lg border px-3 py-2 bg-background ${style.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <h3 className={`text-sm font-semibold ${style.header}`}>{col}</h3>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{byColumn(col).length}</span>
              </div>

              {/* Cards */}
              {byColumn(col).map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  className={`cursor-grab active:cursor-grabbing transition-opacity ${draggingId === card.id ? "opacity-40" : "opacity-100"}`}
                >
                  <KanbanCard card={card} onUpdateProgress={openUpdate} onSendForReview={openReview} />
                </div>
              ))}

              {byColumn(col).length === 0 && (
                <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border/40">
                  <p className="text-xs text-muted-foreground">Drop designs here</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Update Progress Dialog */}
      <Dialog open={updateDialog} onOpenChange={setUpdateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Design Progress</DialogTitle>
          </DialogHeader>
          {activeCard && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg bg-muted/40 p-3">
                <img
                  src={activeCard.thumbnail}
                  alt=""
                  className="h-14 w-20 rounded-md object-cover shrink-0"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div>
                  <p className="font-medium text-sm">{activeCard.projectName}</p>
                  <p className="text-xs text-muted-foreground">{activeCard.clientName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeCard.designType}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Completion: {newProgress}%</label>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={newProgress}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className="w-full accent-primary h-2"
                />
                <ProgressBar value={newProgress} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Concept</span>
                  <span>Schematic</span>
                  <span>Detail</span>
                  <span>Final</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgress}>Save Progress</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send For Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Send for Internal Review</DialogTitle>
          </DialogHeader>
          {activeCard && (
            <div className="flex gap-3 rounded-lg bg-muted/40 p-3">
              <img
                src={activeCard.thumbnail}
                alt=""
                className="h-14 w-20 rounded-md object-cover shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div>
                <p className="font-medium text-sm">{activeCard.projectName}</p>
                <p className="text-xs text-muted-foreground">{activeCard.clientName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Designer: {activeCard.designer}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            This will move the design to <strong>Ready For Review</strong> and notify the internal design review team.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
            <Button onClick={handleSendForReview} className="gap-2">
              <Send className="h-4 w-4" />
              Send for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
