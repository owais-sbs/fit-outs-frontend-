import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { LEAD_SOURCES } from "../data/leads";
import { fetchAllLeads, updateLeadStatus, convertLeadToClient } from "../api/leads.api";
import { useAuth } from "@/shared/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

const VIEW_FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "follow-ups", label: "Follow-ups" },
  { id: "lost", label: "Lost" },
];

function matchesView(lead, view) {
  if (view === "all") return true;
  if (view === "new") return lead.status === "NEW" || lead.statusLabel === "New";
  if (view === "qualified") {
    return (
      lead.status === "QUALIFIED" ||
      lead.statusLabel === "Qualified" ||
      lead.status === "SITE_VISIT_SCHEDULED"
    );
  }
  if (view === "follow-ups") return lead.status !== "LOST" && lead.status !== "CLIENT";
  if (view === "lost") return lead.status === "LOST";
  return true;
}

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  FOLLOWUP: "Followup",
  LOST: "Lost",
  CLIENT: "Client",
};

export default function LeadsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [convertLead, setConvertLead] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchAllLeads()
      .then((data) => {
        if (cancelled) return;
        setAllLeads(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLeads.filter((l) => {
      const matchQ =
        !q ||
        l.clientName?.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q));
      const matchView = matchesView(l, view);
      const matchStatus = view !== "all" || statusFilter === "all" || l.status === statusFilter;
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      return matchQ && matchView && matchStatus && matchSource;
    });
  }, [search, statusFilter, sourceFilter, allLeads, view]);

  const setView = (next) => {
    setPage(1);
    if (next === "all") {
      searchParams.delete("view");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ view: next }, { replace: true });
    }
  };

  const patchLeadInList = (updated) => {
    setAllLeads((prev) => prev.map((l) => (String(l.id) === String(updated.id) ? updated : l)));
  };

  const openConvertDialog = (lead) => {
    setConvertError("");
    setConvertLead(lead);
  };

  const handleStatusChange = async (lead, newStatus) => {
    if (!newStatus || newStatus === lead.status) return;
    if (newStatus === "CLIENT") {
      openConvertDialog(lead);
      return;
    }
    setStatusSavingId(lead.id);
    try {
      const updated = await updateLeadStatus(lead.id, newStatus, user?.id);
      patchLeadInList(updated);
    } catch (err) {
      console.error("Failed to update lead status:", err);
    } finally {
      setStatusSavingId(null);
    }
  };

  const handleConfirmConvert = async () => {
    if (!convertLead) return;
    setConverting(true);
    setConvertError("");
    try {
      const updated = await convertLeadToClient(convertLead.id);
      patchLeadInList(updated);
      setConvertLead(null);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to convert lead to client";
      setConvertError(message);
      console.error("Failed to convert lead:", err);
    } finally {
      setConverting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageShell>
      <PageHeader
        title="Leads"
        description="View and manage your sales pipeline."
        actions={
          <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.LEADS_NEW)}>
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {VIEW_FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={view === f.id ? "default" : "outline"}
            onClick={() => setView(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {view === "all" && (
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="max-h-[calc(100vh-26rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Ref No.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Project Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No leads found</p>
                        <p className="text-sm text-muted-foreground">Adjust filters or search terms</p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", lead.id))}
                    >
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                        {lead.referenceNo || "\u2014"}
                      </TableCell>
                      <TableCell className="font-medium">{lead.clientName}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          key={`${lead.id}-${lead.status}`}
                          value={lead.status}
                          onValueChange={(value) => handleStatusChange(lead, value)}
                          disabled={statusSavingId === lead.id || converting}
                        >
                          <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {lead.status === "CLIENT" && !lead.accountCreated && (
                          <button
                            type="button"
                            className="mt-1 block text-[11px] text-amber-700 underline"
                            onClick={() => openConvertDialog(lead)}
                          >
                            Finish client setup
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.projectType || "\u2014"}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[160px] truncate">
                        {lead.email || "\u2014"}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", lead.id)); }}>View</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""} &middot; Page {page} of {totalPages}
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

      <Dialog open={!!convertLead} onOpenChange={(open) => { if (!open && !converting) { setConvertLead(null); setConvertError(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will create a client portal account for{" "}
            <span className="font-medium text-foreground">{convertLead?.email || convertLead?.clientName}</span>,
            email them a link to set their password, create a starter project, and move this lead to Client status.
          </p>
          {convertError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {convertError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConvertLead(null); setConvertError(""); }} disabled={converting}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={converting}
              onClick={handleConfirmConvert}
            >
              {converting ? "Converting..." : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
