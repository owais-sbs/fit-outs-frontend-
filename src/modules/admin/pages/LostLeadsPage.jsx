import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Search, XCircle, DollarSign, TrendingDown, RotateCcw } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { getAllLeads, LEAD_SOURCES, SALES_REPS } from "../data/leads";
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
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

export default function LostLeadsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const allLeads = useMemo(() => getAllLeads(), []);
  const lostLeads = useMemo(() => allLeads.filter((l) => l.stage === "lost"), [allLeads]);

  const stats = useMemo(() => ({
    total: lostLeads.length,
    totalBudget: lostLeads.reduce((s, l) => s + (l.budget || 0), 0),
    lostPercentage: allLeads.length > 0
      ? Math.round((lostLeads.length / allLeads.length) * 100)
      : 0,
    wonCount: allLeads.filter((l) => l.stage === "won").length,
  }), [lostLeads, allLeads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lostLeads.filter((l) => {
      const matchQ =
        !q ||
        l.clientName.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q));
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchAssignee = assigneeFilter === "all" || l.assignee === assigneeFilter;
      return matchQ && matchSource && matchAssignee;
    });
  }, [search, sourceFilter, assigneeFilter, lostLeads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lost Leads"
        description="Review leads that were lost and analyse reasons for churn."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lost Leads" value={stats.total} icon={XCircle} growth={-5} growthLabel="vs last month" />
        <StatCard title="Revenue Lost" value={formatCurrency(stats.totalBudget)} icon={DollarSign} growth={-8} growthLabel="vs last month" />
        <StatCard title="Loss Rate" value={`${stats.lostPercentage}%`} icon={TrendingDown} growth={stats.lostPercentage > 20 ? 3 : -2} growthLabel="vs last month" />
        <StatCard title="Won vs Lost" value={`${stats.wonCount}W / ${stats.total}L`} icon={RotateCcw} growth={stats.wonCount > stats.total ? 10 : -10} growthLabel="win rate trend" />
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search lost leads..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={(v) => { setAssigneeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  {SALES_REPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
                <TableHead className="pl-6">Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
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
                        <XCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No lost leads</p>
                        <p className="text-sm text-muted-foreground">All leads are active and progressing through the pipeline.</p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", lead.id))}
                    >
                      <TableCell className="pl-6 font-medium">{lead.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.company || "\u2014"}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                      <TableCell>{lead.assignee}</TableCell>
                      <TableCell className="font-medium tabular-nums">{formatCurrency(lead.budget)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {lead.notes || "\u2014"}
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
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Reopen Lead</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">Delete</DropdownMenuItem>
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
