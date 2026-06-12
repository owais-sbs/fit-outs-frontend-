import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, MoreHorizontal, Search, AlertCircle } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { getAllLeads } from "../data/leads";
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

function getFollowUpData() {
  const leads = getAllLeads();
  return leads
    .filter((l) => l.followUp && l.followUp !== "\u2014")
    .map((l) => ({
      id: `fu-${l.id}`,
      leadId: l.id,
      clientName: l.clientName,
      company: l.company,
      date: l.followUp,
      assignee: l.assignee,
      priority: l.priority,
      budget: l.budget,
      stage: l.stage,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === "\u2014") return "\u2014";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function getRelativeStatus(dateStr) {
  if (!dateStr || dateStr === "\u2014") return { label: "Unknown", variant: "secondary" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, variant: "destructive" };
  if (diff === 0) return { label: "Today", variant: "warning" };
  if (diff <= 3) return { label: `${diff}d left`, variant: "default" };
  return { label: formatDate(dateStr), variant: "outline" };
}

const PRIORITY_VARIANTS = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export default function FollowUpsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const followUps = useMemo(() => getFollowUpData(), []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const stats = useMemo(() => ({
    today: followUps.filter((f) => {
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length,
    thisWeek: followUps.filter((f) => {
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return d >= today && d <= weekEnd;
    }).length,
    overdue: followUps.filter((f) => {
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    }).length,
    total: followUps.length,
  }), [followUps, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return followUps.filter((f) => {
      const matchQ =
        !q ||
        f.clientName.toLowerCase().includes(q) ||
        (f.company && f.company.toLowerCase().includes(q));
      const d = new Date(f.date);
      d.setHours(0, 0, 0, 0);
      const isOverdue = d < today;
      const isToday = d.getTime() === today.getTime();
      const isUpcoming = d > today;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue" && isOverdue) ||
        (statusFilter === "today" && isToday) ||
        (statusFilter === "upcoming" && isUpcoming);
      return matchQ && matchStatus;
    });
  }, [search, statusFilter, followUps, today]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Track and manage all scheduled follow-up activities across leads."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Follow-ups" value={stats.total} icon={CalendarDays} growth={10} growthLabel="vs last month" />
        <StatCard title="Today" value={stats.today} icon={Clock} growth={0} growthLabel="vs yesterday" />
        <StatCard title="This Week" value={stats.thisWeek} icon={CheckCircle2} growth={15} growthLabel="vs last week" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertCircle} growth={stats.overdue > 0 ? 25 : 0} growthLabel="vs last month" />
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search follow-ups..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
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
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Stage</TableHead>
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
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No follow-ups found</p>
                        <p className="text-sm text-muted-foreground">Adjust filters or search terms</p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((fu) => {
                    const status = getRelativeStatus(fu.date);
                    return (
                      <TableRow
                        key={fu.id}
                        className="cursor-pointer"
                        onClick={() => navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", fu.leadId))}
                      >
                        <TableCell className="pl-6 font-medium">{fu.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{fu.company || "\u2014"}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(fu.date)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{fu.assignee}</TableCell>
                        <TableCell>
                          <Badge variant={PRIORITY_VARIANTS[fu.priority]} className="capitalize">{fu.priority}</Badge>
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{fu.stage}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(ROUTES.ADMIN.LEAD_DETAIL.replace(":leadId", fu.leadId)); }}>View Lead</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Mark Completed</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Reschedule</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} follow-up{filtered.length !== 1 ? "s" : ""} &middot; Page {page} of {totalPages}
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
