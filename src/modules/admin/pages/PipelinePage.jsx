import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import {
  PIPELINE_COLUMNS,
  INITIAL_LEADS,
  LEAD_SOURCES,
  PROJECT_TYPES,
  PRIORITIES,
  SALES_REPS,
} from "../data/leads";
import { fetchAllLeads } from "../api/leads.api";
import PipelineColumn from "../components/pipeline/PipelineColumn";
import LeadCard from "../components/pipeline/LeadCard";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

// ─── helpers ─────────────────────────────────────────────────────────────────
function findColumn(leadsState, leadId) {
  return Object.keys(leadsState).find((col) =>
    leadsState[col].some((l) => l.id === leadId)
  );
}

const PRIORITY_VARIANT = {
  high: "destructive", High: "destructive",
  medium: "warning",   Medium: "warning",
  low: "secondary",    Low: "secondary",
};

// ─── Stat bar ─────────────────────────────────────────────────────────────────
function PipelineStat({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-8 py-4 text-center min-w-[140px]">
      <p className="text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
      {sub && <p className="text-xs text-primary font-bold">{sub}</p>}
    </div>
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [activeId, setActiveId] = useState(null);
  const [previewLead, setPreviewLead] = useState(null);

  // Fetch leads from API and group by stage
  useEffect(() => {
    let cancelled = false;
    fetchAllLeads()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (list.length === 0) return; // keep mock fallback

        // Group by stage — default unmapped stages to "new"
        const validStages = PIPELINE_COLUMNS.map((c) => c.id);
        const grouped = Object.fromEntries(validStages.map((s) => [s, []]));
        list.forEach((lead) => {
          const stage = validStages.includes(lead.stage) ? lead.stage : "new";
          grouped[stage].push({ ...lead, stage });
        });
        setLeads(grouped);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch leads for pipeline:", err);
        // keep mock data as fallback
      });
    return () => { cancelled = true; };
  }, []);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [filterSource, filterAssignee, filterPriority, filterProject]
    .filter((f) => f !== "all").length;

  const resetFilters = () => {
    setFilterSource("all");
    setFilterAssignee("all");
    setFilterPriority("all");
    setFilterProject("all");
    setSearch("");
  };

  // ── Filtered leads ─────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filterLead = (lead) => {
      if (q && !lead.clientName.toLowerCase().includes(q) &&
          !lead.company?.toLowerCase().includes(q) &&
          !lead.phone?.includes(q) &&
          !lead.email?.toLowerCase().includes(q)) return false;
      if (filterSource   !== "all" && lead.source      !== filterSource)   return false;
      if (filterAssignee !== "all" && lead.assignee    !== filterAssignee) return false;
      if (filterPriority !== "all" && lead.priority?.toLowerCase() !== filterPriority.toLowerCase()) return false;
      if (filterProject  !== "all" && lead.projectType !== filterProject)  return false;
      return true;
    };
    const result = {};
    for (const col of Object.keys(leads)) {
      result[col] = leads[col].filter(filterLead);
    }
    return result;
  }, [leads, search, filterSource, filterAssignee, filterPriority, filterProject]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const allLeads = Object.values(leads).flat();
  const totalLeads = allLeads.length;
  const totalValue = allLeads.reduce((s, l) => s + (l.budget || 0), 0);
  const wonLeads   = leads.won?.length || 0;

  // ── DnD ───────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeLead = activeId
    ? Object.values(leads).flat().find((l) => l.id === activeId)
    : null;

  const onDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const activeCol = findColumn(leads, active.id);
    let overCol = over.id;
    if (!PIPELINE_COLUMNS.find((c) => c.id === overCol)) {
      overCol = findColumn(leads, over.id);
    }
    if (!activeCol || !overCol || activeCol === overCol) return;
    setLeads((prev) => {
      const lead = prev[activeCol].find((l) => l.id === active.id);
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter((l) => l.id !== active.id),
        [overCol]: [...(prev[overCol] || []), { ...lead, stage: overCol }],
      };
    });
  };

  return (
    <div className="flex h-full flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        title="CRM Pipeline"
        description="Drag leads across stages — New through Won and Lost."
        actions={
          <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.LEADS_NEW)}>
            <Plus className="h-4 w-4" />
            Add lead
          </Button>
        }
      />

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center divide-x divide-border/60 rounded-xl border border-border/60 bg-card shadow-sm w-fit">
        <PipelineStat label="Total leads" value={totalLeads} />
        <PipelineStat label="Pipeline value" value={`$${(totalValue / 1000).toFixed(0)}k`} />
        <PipelineStat label="Won" value={wonLeads} sub={totalLeads ? `${Math.round((wonLeads / totalLeads) * 100)}%` : "0%"} />
        <PipelineStat label="Active cols" value={PIPELINE_COLUMNS.length} />
      </div>

      {/* ── Search + filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-muted-foreground" onClick={resetFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Inline filter row ─────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              {SALES_REPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Project type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Kanban board ──────────────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {PIPELINE_COLUMNS.map((col) => (
            <PipelineColumn
              key={col.id}
              column={col}
              leads={filteredLeads[col.id] || []}
              onLeadClick={(id) => {
                const lead = Object.values(leads).flat().find((l) => l.id === id);
                if (lead) setPreviewLead(lead);
              }}
              onLeadNavigate={(id) => navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", id))}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="w-[280px] rotate-2 opacity-95">
              <LeadCard lead={activeLead} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Lead preview sheet ─────────────────────────────────────────────── */}
      <Sheet open={!!previewLead} onOpenChange={(o) => !o && setPreviewLead(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-lg">{previewLead?.clientName}</SheetTitle>
            <p className="text-sm text-muted-foreground">{previewLead?.company}</p>
          </SheetHeader>

          {previewLead && (
            <div className="mt-4 space-y-4">
              {/* Status + priority */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{previewLead.stage}</Badge>
                <Badge variant={PRIORITY_VARIANT[previewLead.priority] || "secondary"} className="capitalize">
                  {previewLead.priority} priority
                </Badge>
                {previewLead.projectType && (
                  <Badge variant="outline">{previewLead.projectType}</Badge>
                )}
              </div>

              <Separator />

              {/* Key info */}
              <Card className="border-border/60">
                <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold text-primary">${previewLead.budget?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-medium">{previewLead.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{previewLead.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                    <p className="font-medium">{previewLead.followUp}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{previewLead.location || "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned rep */}
              <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary font-semibold">
                    {previewLead.assignee?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{previewLead.assignee}</p>
                  <p className="text-xs text-muted-foreground">Sales rep</p>
                </div>
              </div>

              {/* Notes preview */}
              {previewLead.notes && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm line-clamp-3">{previewLead.notes}</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", previewLead.id))}
              >
                Open full lead detail
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
