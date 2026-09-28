import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import {
  Building2,
  CircleDollarSign,
  CreditCard,
  PauseCircle,
} from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import StatCard from "../components/StatCard";
import StatCardSkeleton from "../components/StatCardSkeleton";
import FiltersBar from "../components/FiltersBar";
import TenantTable from "../components/TenantTable";
import TenantTableSkeleton from "../components/TenantTableSkeleton";
import { useTenantManagement } from "../context/tenant-management-context";
import { ROUTES } from "@/shared/constants/routes";
import { formatAed } from "@/shared/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance from "@/lib/axiosInstance";

const STAT_ICONS = {
  "total-tenants": Building2,
  "active-subscriptions": CreditCard,
  suspended: PauseCircle,
  "paid-amount": CircleDollarSign,
};

const STATUS_VARIANT = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  CANCELLED: "secondary",
};

function filterTenants(tenants, searchQuery, planFilter, statusFilter) {
  const query = searchQuery.trim().toLowerCase();

  return tenants.filter((tenant) => {
    const matchesSearch =
      !query ||
      tenant.name.toLowerCase().includes(query) ||
      tenant.plan.toLowerCase().includes(query);

    const matchesPlan =
      planFilter === "all" ||
      tenant.plan.toLowerCase() === planFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });
}

export default function SuperAdminDashboard() {
  const { tenants, tenantsLoading, stats } = useTenantManagement();
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPaymentsLoading(true);
    axiosInstance
      .get("/subscription-payments")
      .then(({ data }) => {
        if (cancelled) return;
        setPayments(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = tenantsLoading || paymentsLoading;

  const filteredTenants = useMemo(
    () => filterTenants(tenants, searchQuery, planFilter, statusFilter),
    [tenants, searchQuery, planFilter, statusFilter]
  );

  const paymentStats = useMemo(() => {
    const pending = payments.filter((p) => p.status === "PENDING").length;
    const paidAmount = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { pending, paidAmount };
  }, [payments]);

  const recentPayments = useMemo(() => payments.slice(0, 8), [payments]);

  const dashboardStats = useMemo(
    () => [
      {
        id: "total-tenants",
        title: "Total companies",
        value: tenants.length.toLocaleString(),
      },
      {
        id: "active-subscriptions",
        title: "Active subscriptions",
        value: stats.activeSubscriptions.toLocaleString(),
      },
      {
        id: "suspended",
        title: "Suspended",
        value: (stats.suspendedTenants || 0).toLocaleString(),
      },
      {
        id: "paid-amount",
        title: "Paid amount",
        value: formatAed(paymentStats.paidAmount),
        growthLabel: `${paymentStats.pending} pending`,
      },
    ],
    [tenants.length, stats, paymentStats]
  );

  return (
    <PageShell className="space-y-10">
      <DashboardHeader />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : dashboardStats.map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                icon={STAT_ICONS[stat.id]}
                growthLabel={stat.growthLabel}
              />
            ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Recent payments</h2>
            <p className="text-sm text-muted-foreground">
              Latest SaaS subscription payment activity
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.SUPER_ADMIN.PAYMENTS}>View all</Link>
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment log</CardTitle>
            <CardDescription>
              Mark payments paid on the Payments page to activate companies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <div className="h-8 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ) : recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPayments.map((row) => (
                    <TableRow key={row.uuid}>
                      <TableCell className="font-medium">{row.companyName}</TableCell>
                      <TableCell>{row.planName}</TableCell>
                      <TableCell>{formatAed(row.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[row.status] || "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tenant overview</h2>
          <p className="text-sm text-muted-foreground">
            Search and filter companies across the platform
          </p>
        </div>
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          planFilter={planFilter}
          onPlanChange={setPlanFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        {isLoading ? (
          <TenantTableSkeleton />
        ) : (
          <TenantTable tenants={filteredTenants} />
        )}
      </section>
    </PageShell>
  );
}
