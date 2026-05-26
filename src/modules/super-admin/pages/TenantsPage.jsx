import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MoreHorizontal, Search } from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";
import PageHeader from "../components/shared/PageHeader";
import { TenantQuickActions } from "../components/tenant-management";
import { useTenantManagement } from "../context/tenant-management-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 8;
const STATUS_VARIANT = {
  active: "success",
  trial: "warning",
  suspended: "secondary",
  expired: "destructive",
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRevenue(value) {
  return value ? `$${value.toLocaleString()}` : "-";
}

export default function TenantsPage() {
  const navigate = useNavigate();
  const { tenants, tenantsLoading: loading } = useTenantManagement();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [renewal, setRenewal] = useState("all");
  const [page, setPage] = useState(1);

  // loading state now comes from the context (real API fetch)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchQuery =
        !query ||
        tenant.company.toLowerCase().includes(query) ||
        tenant.name.toLowerCase().includes(query);
      const matchPlan = plan === "all" || tenant.plan.toLowerCase() === plan;
      const matchStatus = status === "all" || tenant.status === status;
      const matchRenewal = renewal === "all" || tenant.renewalState === renewal;
      return matchQuery && matchPlan && matchStatus && matchRenewal;
    });
  }, [tenants, search, plan, status, renewal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goDetail = (id) =>
    navigate(ROUTES.SUPER_ADMIN.TENANT_DETAIL.replace(":tenantId", id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage fit-out companies, subscriptions, and renewal status across the platform."
        actions={<TenantQuickActions />}
      />

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={plan}
                onValueChange={(value) => {
                  setPlan(value);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={renewal}
                onValueChange={(value) => {
                  setRenewal(value);
                  setPage(1);
                }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Renewal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All renewal</SelectItem>
                  <SelectItem value="auto">Auto-renew</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full max-w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center">
                        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                        <p className="font-medium">No tenants found</p>
                        <p className="text-sm text-muted-foreground">
                          Adjust filters or search terms
                        </p>
                      </TableCell>
                    </TableRow>
                  )
                  : paginated.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer"
                      onClick={() => goDetail(tenant.id)}>
                      <TableCell className="pl-6 font-medium">{tenant.company}</TableCell>
                      <TableCell>{tenant.plan}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[tenant.status]}>{tenant.status}</Badge>
                      </TableCell>
                      <TableCell>{tenant.activeUsers}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(tenant.renewalDate)}
                      </TableCell>
                      <TableCell>{formatRevenue(tenant.revenue)}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(event) => event.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                goDetail(tenant.id);
                              }}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(event) => event.stopPropagation()}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => event.stopPropagation()}
                              className="text-destructive">
                              Suspend
                            </DropdownMenuItem>
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
              {filtered.length} tenant{filtered.length !== 1 ? "s" : ""} - Page {page} of{" "}
              {totalPages}
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={page === index + 1}
                      onClick={() => setPage(index + 1)}
                      className="cursor-pointer">
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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
