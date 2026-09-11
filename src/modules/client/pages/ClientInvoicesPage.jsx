import { CreditCard, Download, Printer, Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageShell, PageTitle, StatTile, Surface } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  fetchClientInvoices,
  clientAcceptPaymentRequest,
  clientRejectPaymentRequest,
} from "@/modules/admin/api/billing.api";
import { fetchAllProjects } from "@/modules/admin/api/projects.api";
import { resolveFileUrl } from "@/modules/admin/api/documents.api";
import { formatAed } from "@/shared/utils/currency";
import { BillingApprovalPipeline } from "@/modules/admin/pages/billing/BillingApprovalPipeline";

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
  PENDING_PM: "Pending Project Manager Approval",
  PENDING_DIRECTOR: "Pending Project Director Approval",
  ISSUED: "Awaiting Client Acceptance",
  CLIENT_ACCEPTED: "Client Accepted Proposal",
  PART_PAID: "Part paid",
  DRAFT: "Draft",
  REJECTED: "Returned to Finance",
};

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
    <div class="amount">${formatAed(inv.amount)}</div>
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
  const [actionBusy, setActionBusy] = useState(false);
  const [message, setMessage] = useState("");

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

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === String(projectId)) || null,
    [projects, projectId]
  );

  const pendingIssuedInvoices = useMemo(
    () =>
      invoices.filter((i) => {
        const s = String(i.status || "").toUpperCase();
        return s === "ISSUED" || s === "PENDING_CLIENT";
      }),
    [invoices]
  );

  const handleClientAcceptAll = async () => {
    if (pendingIssuedInvoices.length === 0) return;
    setActionBusy(true);
    setMessage("");
    try {
      for (const inv of pendingIssuedInvoices) {
        const uuid = inv.uuid || inv.paymentRequestUuid || inv.id;
        if (uuid) {
          await clientAcceptPaymentRequest(uuid, "Client accepted project billing proposal.");
        }
      }
      setMessage(
        "Proposal accepted! Project Manager, Director, and Finance team have been notified. Automated payment deadline reminder emails are active."
      );
      await loadInvoices();
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || "Acceptance failed.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleClientRejectAll = async () => {
    if (pendingIssuedInvoices.length === 0) return;
    const reason = window.prompt("Please state reason for rejecting proposal:");
    if (!reason?.trim()) return;
    setActionBusy(true);
    setMessage("");
    try {
      for (const inv of pendingIssuedInvoices) {
        const uuid = inv.uuid || inv.paymentRequestUuid || inv.id;
        if (uuid) {
          await clientRejectPaymentRequest(uuid, reason.trim());
        }
      }
      setMessage("Proposal returned to PM and Finance team with your feedback notes.");
      await loadInvoices();
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || "Rejection failed.");
    } finally {
      setActionBusy(false);
    }
  };

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
        title="Invoices & Billing Proposals"
        subtitle="Review project profiles, accept billing proposals, and manage payment schedules."
      />

      {message && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </div>
      )}

      {/* Project Selector */}
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

      {/* Project Profile Summary & Package Proposal Approval */}
      {selectedProject && (
        <Surface className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/30 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{selectedProject.projectName || selectedProject.name}</h3>
                <Badge variant="outline">Project Profile</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client: {selectedProject.clientName || selectedProject.name} · Contract Total: {formatAed(totals.total)}
              </p>
            </div>
            {pendingIssuedInvoices.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={actionBusy}
                  onClick={handleClientAcceptAll}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept Proposal ({pendingIssuedInvoices.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  disabled={actionBusy}
                  onClick={handleClientRejectAll}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Reject Proposal
                </Button>
              </div>
            )}
          </div>
          {pendingIssuedInvoices.length > 0 ? (
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between">
              <div>
                <p className="font-semibold">Billing Proposal Awaiting Acceptance</p>
                <p className="mt-0.5">
                  Click <strong>Accept Proposal</strong> to approve this payment schedule. PM, Director, and Finance will be notified immediately, and automated payment deadline emails will be sent as dates approach.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              All proposals for this project profile are accepted or up to date. Automated payment reminder emails are configured for approaching payment due dates.
            </p>
          )}
        </Surface>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total Invoiced" value={formatAed(totals.total)} />
        <StatTile label="Paid" value={formatAed(totals.paid)} hint="Collected" />
        <StatTile label="Outstanding" value={formatAed(totals.pending)} hint="Remaining" />
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
                    <BillingApprovalPipeline status={status} compact className="mt-2 max-w-[240px]" />
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-sm font-bold">{formatAed(inv.amount)}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-1">
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
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
