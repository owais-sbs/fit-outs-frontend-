import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { LEAD_SOURCES } from "../data/leads";
import { fetchAllLeads } from "../api/leads.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

const STATUS_VARIANTS = {
  NEW: "default",
  CONTACTED: "outline",
  QUALIFIED: "warning",
  SITE_VISIT_SCHEDULED: "secondary",
  LOST: "destructive",
  CLIENT: "success",
};

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT_SCHEDULED: "Site Visit Scheduled",
  LOST: "Lost",
  CLIENT: "Client",
};

export default function LeadsListPage() {
  const navigate = useNavigate();
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

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
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      return matchQ && matchStatus && matchSource;
    });
  }, [search, statusFilter, sourceFilter, allLeads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Leads"
        description="View and manage all leads."
        actions={
          <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.LEADS_NEW)}>
            <Plus className="h-4 w-4" />
            Add New Lead
          </Button>
        }
      />

      <Card className="border-border/60 shadow-sm">
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
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="max-h-[calc(100vh-26rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
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
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[lead.status]} className="capitalize">
                          {STATUS_LABELS[lead.status] || lead.status}
                        </Badge>
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
    </div>
  );
}
