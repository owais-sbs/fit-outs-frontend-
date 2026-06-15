import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Search, Users, DollarSign, Target, Star } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { getAllLeads, LEAD_SOURCES } from "../data/leads";
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

const PRIORITY_VARIANTS = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

function formatCurrency(n) {
  return n ? `$${n.toLocaleString()}` : "\u2014";
}

export default function QualifiedLeadsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const qualifiedLeads = useMemo(
    () => getAllLeads().filter((l) => l.status === "QUALIFIED"),
    [],
  );

  const stats = useMemo(() => ({
    total: qualifiedLeads.length,
    totalBudget: qualifiedLeads.reduce((s, l) => s + (l.budget || 0), 0),
    avgBudget: qualifiedLeads.length > 0
      ? Math.round(qualifiedLeads.reduce((s, l) => s + (l.budget || 0), 0) / qualifiedLeads.length)
      : 0,
    highPriority: qualifiedLeads.filter((l) => l.priority === "high").length,
  }), [qualifiedLeads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return qualifiedLeads.filter((l) => {
      const matchQ =
        !q ||
        l.clientName.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q));
      const matchSource = sourceFilter === "all" || l.source === sourceFilter;
      return matchQ && matchSource;
    });
  }, [search, sourceFilter, qualifiedLeads]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualified Leads"
        description="Leads that have been qualified and are ready for the next stage."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Qualified Leads" value={stats.total} icon={Target} growth={8} growthLabel="vs last month" />
        <StatCard title="Total Budget" value={formatCurrency(stats.totalBudget)} icon={DollarSign} growth={12} growthLabel="vs last month" />
        <StatCard title="Avg Budget" value={formatCurrency(stats.avgBudget)} icon={Star} growth={5} growthLabel="vs last month" />
        <StatCard title="High Priority" value={stats.highPriority} icon={Users} growth={stats.highPriority > 0 ? 20 : 0} growthLabel="vs last month" />
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search qualified leads..."
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
                <TableHead>Priority</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full max-w-[100px]" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center">
                        <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No qualified leads</p>
                        <p className="text-sm text-muted-foreground">Leads will appear here once qualified in the pipeline.</p>
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
                      <TableCell>
                        <Badge variant={PRIORITY_VARIANTS[lead.priority]} className="capitalize">{lead.priority}</Badge>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{formatCurrency(lead.budget)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{lead.followUp || "\u2014"}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", lead.id)); }}>View</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Schedule Visit</DropdownMenuItem>
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
