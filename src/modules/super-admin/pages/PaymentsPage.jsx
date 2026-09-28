import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { FilterToolbar, PageShell, SearchInput, StatTile } from "@/components/layout/PageShell";
import { formatAed } from "@/shared/utils/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import axiosInstance from "@/lib/axiosInstance";

const STATUS_VARIANT = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  CANCELLED: "secondary",
};

const PAYMENT_METHODS = ["Bank transfer", "Cash", "Cheque", "Card", "Other"];

const emptyCreate = {
  companyUuid: "",
  planUuid: "",
  amount: "",
  paymentMethod: "Bank transfer",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, companiesRes, plansRes] = await Promise.all([
        axiosInstance.get("/subscription-payments"),
        axiosInstance.get("/companies/GetAllCompanies"),
        axiosInstance.get("/subscription-plans"),
      ]);
      setPayments(Array.isArray(paymentsRes.data?.data) ? paymentsRes.data.data : []);
      setCompanies(Array.isArray(companiesRes.data?.data) ? companiesRes.data.data : []);
      const planList = Array.isArray(plansRes.data?.data) ? plansRes.data.data : [];
      setPlans(planList.filter((p) => p.active !== false));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!query) return true;
      return (
        row.companyName?.toLowerCase().includes(query) ||
        row.planName?.toLowerCase().includes(query) ||
        row.paymentMethod?.toLowerCase().includes(query)
      );
    });
  }, [payments, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = payments.filter((p) => p.status === "PENDING").length;
    const paidAmount = payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { total: payments.length, pending, paidAmount };
  }, [payments]);

  const onCreateChange = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "planUuid") {
        const plan = plans.find((p) => p.uuid === value);
        if (plan && (prev.amount === "" || prev.amount == null)) {
          next.amount = String(plan.priceMonthly ?? "");
        }
      }
      return next;
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.companyUuid || !form.planUuid || form.amount === "") {
      setError("Company, plan, and amount are required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await axiosInstance.post("/subscription-payments", {
        companyUuid: form.companyUuid,
        planUuid: form.planUuid,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        status: "PENDING",
      });
      setCreateOpen(false);
      setForm(emptyCreate);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create payment");
    } finally {
      setCreating(false);
    }
  };

  const decide = async (uuid, action) => {
    setBusyId(uuid);
    setError(null);
    try {
      await axiosInstance.post(`/subscription-payments/${uuid}/${action}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Payment action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Payments"
        description="Manual SaaS subscription payment log. Mark paid to activate a company."
        actions={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Record payment
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total payments" value={stats.total} />
        <StatTile label="Pending" value={stats.pending} />
        <StatTile label="Paid amount" value={formatAed(stats.paidAmount)} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <FilterToolbar>
        <SearchInput
          placeholder="Search company, plan, method..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[160px] rounded-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </FilterToolbar>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                )
                : filtered.map((row) => (
                  <TableRow key={row.uuid}>
                    <TableCell className="pl-6 font-medium">{row.companyName}</TableCell>
                    <TableCell>{row.planName}</TableCell>
                    <TableCell>{formatAed(row.amount)}</TableCell>
                    <TableCell>{row.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status] || "secondary"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {row.status === "PENDING" ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={busyId === row.uuid}
                            onClick={() => decide(row.uuid, "mark-paid")}
                          >
                            {busyId === row.uuid ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={busyId === row.uuid}
                            onClick={() => decide(row.uuid, "mark-failed")}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Mark fail
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === row.uuid}
                            onClick={() => decide(row.uuid, "cancel")}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Create a pending payment. Mark paid later to activate the company and assign the plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={form.companyUuid} onValueChange={onCreateChange("companyUuid")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.uuid} value={c.uuid}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.planUuid} onValueChange={onCreateChange("planUuid")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.uuid} value={p.uuid}>
                      {p.planName} — {formatAed(p.priceMonthly)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={onCreateChange("amount")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.paymentMethod} onValueChange={onCreateChange("paymentMethod")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
