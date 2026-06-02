import { useState, useMemo } from "react";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  MoreHorizontal, UserPlus, Eye, ArrowRight, Plus,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { DESIGN_REQUESTS, DESIGNERS } from "../../data/design-workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 8;

const STATUS_VARIANT = {
  Pending: "warning",
  Assigned: "default",
  Started: "success",
};

const PRIORITY_VARIANT = {
  Low: "secondary",
  Medium: "outline",
  High: "warning",
  Critical: "destructive",
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3 w-3" />
    : <ChevronDown className="ml-1 inline h-3 w-3" />;
}

function formatDate(d) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function DesignRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDesigner, setSelectedDesigner] = useState("");

  const allTypes = [...new Set(DESIGN_REQUESTS.map((r) => r.designType))];

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DESIGN_REQUESTS.filter((r) => {
      const matchQ = !q || r.projectName.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
      const matchType = typeFilter === "all" || r.designType === typeFilter;
      return matchQ && matchStatus && matchPriority && matchType;
    }).sort((a, b) => {
      let va = a[sortField] ?? "";
      let vb = b[sortField] ?? "";
      if (sortField === "dueDate") { va = new Date(va); vb = new Date(vb); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [search, statusFilter, priorityFilter, typeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAssign = (req) => {
    setSelectedRequest(req);
    setSelectedDesigner(req.designerId || "");
    setAssignDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Design Requests"
        description="Manage incoming fit-out and interior design briefs — assign designers and track priorities."
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Requests", value: DESIGN_REQUESTS.length, color: "text-foreground" },
          { label: "Pending", value: DESIGN_REQUESTS.filter(r => r.status === "Pending").length, color: "text-amber-600" },
          { label: "Assigned", value: DESIGN_REQUESTS.filter(r => r.status === "Assigned").length, color: "text-primary" },
          { label: "In Progress", value: DESIGN_REQUESTS.filter(r => r.status === "Started").length, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search project or client..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Started">Started</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[190px]"><SelectValue placeholder="Design Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 cursor-pointer" onClick={() => handleSort("projectName")}>
                  Project Name <SortIcon field="projectName" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                  Client <SortIcon field="clientName" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead>Design Type</TableHead>
                <TableHead>Assigned Designer</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("priority")}>
                  Priority <SortIcon field="priority" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
                  Due Date <SortIcon field="dueDate" sortField={sortField} sortDir={sortDir} />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                    No design requests match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-medium">{req.projectName}</p>
                        <p className="text-xs text-muted-foreground">{req.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{req.clientName}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
                        {req.designType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.assignedDesigner ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {req.assignedDesigner.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-sm">{req.assignedDesigner}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[req.priority]}>{req.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(req.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[req.status]}>{req.status}</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" /> View Brief
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => openAssign(req)}>
                            <UserPlus className="h-4 w-4" /> Assign Designer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-primary">
                            <ArrowRight className="h-4 w-4" /> Move to In Progress
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} request{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)} className="cursor-pointer">
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Assign Designer Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Interior Designer</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="font-medium">{selectedRequest.projectName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.clientName} · {selectedRequest.designType}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Designer</label>
                <div className="grid gap-2">
                  {DESIGNERS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDesigner(d.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        selectedDesigner === d.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {d.avatar}
                      </div>
                      <span className="text-sm font-medium">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setAssignDialogOpen(false)} disabled={!selectedDesigner}>
              Assign Designer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
