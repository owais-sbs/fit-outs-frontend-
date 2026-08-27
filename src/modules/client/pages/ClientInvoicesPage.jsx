import { CreditCard, Download, Printer, Search, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { fetchClientInvoices } from "@/modules/admin/api/billing.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";

const STATUS_VARIANT = {
  Paid: "success",
  PAID: "success",
  Pending: "warning",
  PENDING_PM: "warning",
  ISSUED: "warning",
  Overdue: "destructive",
  PART_PAID: "secondary",
  DRAFT: "outline",
  REJECTED: "destructive",
};

const STATUS_LABEL = {
  PAID: "Paid",
  PENDING_PM: "Pending approval",
  ISSUED: "Issued",
  PART_PAID: "Part paid",
  DRAFT: "Draft",
  REJECTED: "Rejected",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(
    Number(amount) || 0
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return String(d);
  }
}

function printInvoice(inv) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    window.print();
    return;
  }
  const status = STATUS_LABEL[inv.status] || inv.status || "Issued";
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:32px;color:#18181b}
      h1{font-size:20px;margin:0 0 8px}
      .meta{color:#71717a;font-size:13px;margin-bottom:24px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e4e4e7}
      .amount{font-size:22px;font-weight:700;margin-top:24px}
      @media print{button{display:none}}
    </style></head><body>
    <h1>${inv.invoiceNumber || inv.name || "Invoice"}</h1>
    <div class="meta">${status} · Due ${formatDate(inv.dueDate)}</div>
    <div class="row"><span>Description</span><span>${inv.description || inv.notes || "Payment request"}</span></div>
    <div class="row"><span>Status</span><span>${status}</span></div>
    <div class="amount">${formatCurrency(inv.amount)}</div>
    <p style="margin-top:32px"><button onclick="window.print()">Print</button></p>
    <script>window.onload=function(){setTimeout(function(){window.print()},200)}</script>
    </body></html>`);
  w.document.close();
}

export default function ClientInvoicesPage() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAllProjects()
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setProjects(arr);
        if (arr[0]?.id) setProjectId(String(arr[0].id));
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const loadInvoices = useCallback(() => {
    if (!projectId) {
      setInvoices([]);
      return;
    }
    setInvLoading(true);
    fetchClientInvoices(projectId)
      .then((list) => setInvoices(Array.isArray(list) ? list : []))
      .catch(() => setInvoices([]))
      .finally(() => setInvLoading(false));
  }, [projectId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filtered = invoices.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(i.id || i.uuid || "").toLowerCase().includes(q) ||
      String(i.description || i.name || i.notes || "").toLowerCase().includes(q) ||
      String(i.status || "").toLowerCase().includes(q)
    );
  });

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const paid = invoices
      .filter((i) => String(i.status).toUpperCase() === "PAID")
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return { total, paid, pending: total - paid };
  }, [invoices]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageTitle
        title="Invoices"
        subtitle="Payment schedule and invoices for your fit-out projects."
      />

      <div className="w-full space-y-1 sm:max-w-xs">
        <Label className="text-xs">Project</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.projectName || p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total Invoiced" value={formatCurrency(totals.total)} />
        <StatTile label="Paid" value={formatCurrency(totals.paid)} hint="Collected" />
        <StatTile label="Outstanding" value={formatCurrency(totals.pending)} hint="Remaining" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Surface className="overflow-hidden">
        {invLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <CreditCard className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">No invoices found</p>
            <p className="mt-1 text-xs">
              {projectId ? "No issued payment requests for this project." : "Select a project to view invoices."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((inv) => {
              const status = inv.status || "ISSUED";
              const fileHref = resolveFileUrl(inv.filePath || inv.pdfPath || inv.downloadUrl);
              return (
                <div key={inv.uuid || inv.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-sm font-semibold">
                        {inv.invoiceNumber || inv.id || String(inv.uuid || "").slice(0, 8)}
                      </p>
                      <Badge variant={STATUS_VARIANT[status] || "secondary"}>
                        {STATUS_LABEL[status] || status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {inv.description || inv.name || inv.notes || "Payment request"}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-sm font-bold">{formatCurrency(inv.amount)}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  {fileHref ? (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Download">
                      <a href={fileHref} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title="Print / PDF"
                      onClick={() => printInvoice(inv)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
