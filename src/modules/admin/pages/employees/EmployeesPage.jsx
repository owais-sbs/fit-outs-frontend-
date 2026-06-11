import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Download, MoreHorizontal, Plus,
  Search, Upload, UserCheck, UserMinus, Users,
} from "lucide-react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import StatCard from "@/modules/super-admin/components/StatCard";
import { fetchAllEmployees } from "../../api/employees.api";
import { EMPLOYEE_DEPARTMENTS, EMPLOYEE_ROLES, EMPLOYEE_STATUSES } from "../../data/employees";
import { ROUTES } from "@/shared/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 8;

const STATUS_VARIANTS = { active: "success", inactive: "secondary", suspended: "destructive" };

// Deterministic avatar colour from name — cycles through 8 pleasant palette entries
const AVATAR_PALETTES = [
  { tw: "bg-violet-500/15 text-violet-700", hex: "7C3AED" },
  { tw: "bg-sky-500/15 text-sky-700",       hex: "0284C7" },
  { tw: "bg-emerald-500/15 text-emerald-700", hex: "059669" },
  { tw: "bg-amber-500/15 text-amber-700",   hex: "B45309" },
  { tw: "bg-rose-500/15 text-rose-700",     hex: "BE123C" },
  { tw: "bg-indigo-500/15 text-indigo-700", hex: "4338CA" },
  { tw: "bg-teal-500/15 text-teal-700",     hex: "0F766E" },
  { tw: "bg-orange-500/15 text-orange-700", hex: "C2410C" },
];

function avatarPalette(name = "") {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarUrl(name = "") {
  const palette = avatarPalette(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${palette.hex}&color=ffffff&size=80&bold=true&format=svg`;
}

function SortTh({ label, field, current, dir, onSort }) {
  const active = current === field;
  return (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(field)}
    >
      {label}
      <span className="ml-1 text-[10px] text-muted-foreground">
        {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </TableHead>
  );
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    let cancelled = false;
    fetchAllEmployees()
      .then((data) => { if (!cancelled) setEmployees(data); })
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status !== "active").length,
    departments: new Set(employees.map((e) => e.department)).size,
  }), [employees]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = employees.filter((e) => {
      const matchQ = !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || (e.roles || []).includes(roleFilter);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchQ && matchRole && matchDept && matchStatus;
    });
    return [...list].sort((a, b) => {
      const av = (a[sortField] || "").toString().toLowerCase();
      const bv = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [search, roleFilter, deptFilter, statusFilter, employees, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToDetail = (id) => navigate(ROUTES.ADMIN.EMPLOYEE_DETAIL.replace(":employeeId", id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee information, roles and permissions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate(ROUTES.ADMIN.EMPLOYEE_NEW)}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={stats.total} icon={Users} growth={8} growthLabel="vs last month" />
        <StatCard title="Active" value={stats.active} icon={UserCheck} growth={5} growthLabel="vs last month" />
        <StatCard title="Inactive / Suspended" value={stats.inactive} icon={UserMinus} growth={-2} growthLabel="vs last month" />
        <StatCard title="Departments" value={stats.departments} icon={Building2} growth={0} growthLabel="no change" />
      </section>

      {/* Filters */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, ID, email, department..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[145px]"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {EMPLOYEE_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[155px]"><SelectValue placeholder="All departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {EMPLOYEE_DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {EMPLOYEE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
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
            <TableHeader className="bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-14" />
                <SortTh label="Emp ID" field="employeeId" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Name" field="fullName" current={sortField} dir={sortDir} onSort={handleSort} />
                <SortTh label="Designation" field="designation" current={sortField} dir={sortDir} onSort={handleSort} />
                <TableHead>Roles</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-40 text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium">No employees found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className="cursor-pointer"
                      onClick={() => goToDetail(emp.id)}
                    >
                      {/* Avatar with real image */}
                      <TableCell className="pl-6">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={emp.avatar || avatarUrl(emp.fullName)}
                            alt={emp.fullName}
                          />
                          <AvatarFallback className={`text-xs font-bold ${avatarPalette(emp.fullName).tw}`}>
                            {initials(emp.fullName)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* ID */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {emp.employeeId}
                      </TableCell>

                      {/* Name + reporting manager */}
                      <TableCell>
                        <p className="font-medium leading-tight">{emp.fullName}</p>
                        {emp.reportingManager && emp.reportingManager !== "—" && (
                          <p className="text-[11px] text-muted-foreground">
                            Reports to {emp.reportingManager}
                          </p>
                        )}
                      </TableCell>

                      {/* Designation */}
                      <TableCell className="text-sm text-muted-foreground">
                        {emp.designation}
                      </TableCell>

                      {/* Roles — all as small pills */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(emp.roles || []).map((r) => (
                            <span
                              key={r}
                              className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                        {emp.email}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {emp.phone}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[emp.status]} className="capitalize">
                          {emp.status}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => goToDetail(emp.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(ROUTES.ADMIN.EMPLOYEE_DETAIL.replace(":employeeId", emp.id) + "?tab=role")
                              }
                            >
                              Manage Roles
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              {emp.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} employees
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={page === i + 1}
                      onClick={() => setPage(i + 1)}
                      className="cursor-pointer"
                    >
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

