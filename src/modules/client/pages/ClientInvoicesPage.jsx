import { CreditCard, Download, Search } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/modules/super-admin/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const INVOICES = [
  { id: "INV-2601", project: "Luxury Penthouse Fit-Out", description: "Concept Design Stage — 40%", amount: 48000, status: "Paid", dueDate: "2026-05-15", paidDate: "2026-05-14" },
  { id: "INV-2602", project: "Corporate HQ Office Fit-Out", description: "Schematic Design — 25%", amount: 62500, status: "Paid", dueDate: "2026-05-20", paidDate: "2026-05-19" },
  { id: "INV-2603", project: "High-End Villa Interior", description: "Design Development Stage — 35%", amount: 35000, status: "Pending", dueDate: "2026-06-10", paidDate: null },
  { id: "INV-2604", project: "Boutique Hotel Lobby", description: "FF&E Procurement Deposit", amount: 120000, status: "Paid", dueDate: "2026-05-01", paidDate: "2026-04-30" },
  { id: "INV-2605", project: "Flagship Retail Store", description: "Construction Documentation", amount: 28000, status: "Overdue", dueDate: "2026-05-28", paidDate: null },
];

const STATUS_VARIANT = { Paid: "success", Pending: "warning", Overdue: "destructive" };

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default function ClientInvoicesPage() {
  const [search, setSearch] = useState("");
  const filtered = INVOICES.filter(
    (i) => !search.trim() || i.project.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())
  );
  const totalPaid = INVOICES.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = INVOICES.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Payment schedule and invoices for your interior design and fit-out projects."
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Invoiced", value: formatCurrency(INVOICES.reduce((s, i) => s + i.amount, 0)), color: "text-foreground" },
          { label: "Paid", value: formatCurrency(totalPaid), color: "text-emerald-600" },
          { label: "Outstanding", value: formatCurrency(totalPending), color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40">
          {filtered.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold font-mono">{inv.id}</p>
                  <Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{inv.project} — {inv.description}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-bold">{formatCurrency(inv.amount)}</p>
                <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
